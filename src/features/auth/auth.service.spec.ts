import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionCacheService } from '../../shared/cache/session-cache.service';
import { UserRole } from '../../contracts';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

/**
 * Testes unitários do módulo de autenticação (issue #10).
 * Todas as dependências externas (banco, Redis) são dubladas.
 */
describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<
    Pick<UsersService, 'create' | 'findByEmailWithSecret' | 'findById' | 'markLoggedIn'>
  >;
  let sessions: jest.Mocked<Pick<SessionCacheService, 'save' | 'invalidate'>>;
  let refreshRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
  };

  const jwtCfg = {
    accessSecret: 'test-access',
    accessTtl: 900,
    refreshSecret: 'test-refresh',
    refreshTtl: 1209600,
  };

  const buildUser = (over: Partial<Record<string, unknown>> = {}) => ({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'ana@exemplo.com',
    fullName: 'Ana',
    role: UserRole.CUSTOMER,
    status: 'active',
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  });

  beforeEach(async () => {
    users = {
      create: jest.fn(),
      findByEmailWithSecret: jest.fn(),
      findById: jest.fn(),
      markLoggedIn: jest.fn().mockResolvedValue(undefined),
    };
    sessions = {
      save: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
    };
    refreshRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
      update: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: SessionCacheService, useValue: sessions },
        { provide: getRepositoryToken(RefreshTokenEntity), useValue: refreshRepo },
        {
          provide: JwtService,
          useValue: new JwtService({}),
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => jwtCfg },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('hasheia a senha com Argon2id e emite um par de tokens', async () => {
      users.create.mockResolvedValue(buildUser() as never);

      const tokens = await service.register({
        email: 'ana@exemplo.com',
        password: 'Senha#Forte123',
        fullName: 'Ana',
      });

      expect(users.create).toHaveBeenCalledTimes(1);
      const passedHash = users.create.mock.calls[0][0].passwordHash;
      expect(passedHash).toMatch(/^\$argon2id\$/);
      await expect(argon2.verify(passedHash, 'Senha#Forte123')).resolves.toBe(true);
      expect(tokens).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      );
      expect(refreshRepo.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('rejeita credenciais inválidas sem vazar existência de e-mail', async () => {
      users.findByEmailWithSecret.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@exemplo.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(users.markLoggedIn).not.toHaveBeenCalled();
    });

    it('rejeita senha errada de usuário existente', async () => {
      const passwordHash = await argon2.hash('SenhaCerta123');
      users.findByEmailWithSecret.mockResolvedValue({ ...buildUser(), passwordHash } as never);

      await expect(
        service.login({ email: 'ana@exemplo.com', password: 'SenhaErrada123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('autentica, marca login e grava sessão no cache', async () => {
      const passwordHash = await argon2.hash('SenhaCerta123');
      users.findByEmailWithSecret.mockResolvedValue({ ...buildUser(), passwordHash } as never);

      const tokens = await service.login({ email: 'ana@exemplo.com', password: 'SenhaCerta123' });

      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(users.markLoggedIn).toHaveBeenCalledWith(buildUser().id);
      expect(sessions.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: buildUser().id, role: UserRole.CUSTOMER }),
      );
    });

    it('bloqueia conta suspensa', async () => {
      const passwordHash = await argon2.hash('SenhaCerta123');
      users.findByEmailWithSecret.mockResolvedValue({
        ...buildUser({ status: 'suspended' }),
        passwordHash,
      } as never);

      await expect(
        service.login({ email: 'ana@exemplo.com', password: 'SenhaCerta123' }),
      ).rejects.toThrow(/suspensa/);
    });
  });

  describe('refresh', () => {
    const jwt = new JwtService({});
    const makeRefresh = (familyId: string, sub = buildUser().id) =>
      jwt.sign(
        { sub, familyId, type: 'refresh' },
        { secret: jwtCfg.refreshSecret, expiresIn: 3600 },
      );

    it('rotaciona o token: revoga o antigo e emite um novo', async () => {
      const token = makeRefresh('fam-1');
      refreshRepo.findOne.mockResolvedValue({
        id: 't1',
        familyId: 'fam-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 3600_000),
      });
      users.findById.mockResolvedValue(buildUser() as never);

      const tokens = await service.refresh(token);

      expect(refreshRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't1', revokedAt: expect.any(Date) }),
      );
      expect(tokens.refreshToken).toEqual(expect.any(String));
      expect(refreshRepo.insert).toHaveBeenCalled();
    });

    it('detecta reuso: token já revogado invalida a família inteira', async () => {
      const token = makeRefresh('fam-1');
      refreshRepo.findOne.mockResolvedValue({
        id: 't1',
        familyId: 'fam-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600_000),
      });

      await expect(service.refresh(token)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ familyId: 'fam-1' }),
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      expect(sessions.invalidate).toHaveBeenCalled();
    });

    it('rejeita refresh token desconhecido', async () => {
      refreshRepo.findOne.mockResolvedValue(null);
      await expect(service.refresh(makeRefresh('fam-x'))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejeita string que não é JWT de refresh', async () => {
      await expect(service.refresh('nao-e-um-jwt')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revoga a família e limpa a sessão do cache', async () => {
      const jwt = new JwtService({});
      const token = jwt.sign(
        { sub: buildUser().id, familyId: 'fam-9', type: 'refresh' },
        { secret: jwtCfg.refreshSecret, expiresIn: 3600 },
      );

      await service.logout(token);

      expect(refreshRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ familyId: 'fam-9' }),
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      expect(sessions.invalidate).toHaveBeenCalledWith(buildUser().id);
    });

    it('é idempotente para token inválido', async () => {
      await expect(service.logout('lixo')).resolves.toBeUndefined();
      expect(refreshRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('validateAccessToken', () => {
    it('aceita access token válido e retorna a identidade', async () => {
      const jwt = new JwtService({});
      const token = jwt.sign(
        { sub: buildUser().id, email: 'ana@exemplo.com', role: UserRole.CUSTOMER, type: 'access' },
        { secret: jwtCfg.accessSecret, expiresIn: 900 },
      );
      await expect(service.validateAccessToken(token)).resolves.toEqual({
        id: buildUser().id,
        email: 'ana@exemplo.com',
        role: UserRole.CUSTOMER,
      });
    });

    it('rejeita um refresh token no lugar do access', async () => {
      const jwt = new JwtService({});
      const token = jwt.sign(
        { sub: buildUser().id, familyId: 'f', type: 'refresh' },
        { secret: jwtCfg.accessSecret, expiresIn: 900 },
      );
      await expect(service.validateAccessToken(token)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
