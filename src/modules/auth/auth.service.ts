import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { SessionCacheService } from '../../cache/session-cache.service';
import { JwtConfig } from '../../config/configuration';
import {
  AuthenticatedUser,
  IAuthService,
  JwtAccessPayload,
  JwtRefreshPayload,
  LoginInput,
  RegisterInput,
  RequestContext,
  TokenPair,
  UserRole,
} from '../../contracts';
import { UsersService } from '../users/users.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

/**
 * Autenticação stateless (issue #7): JWT de acesso curto + refresh token rotativo
 * com detecção de reuso, Argon2id para hash de senha e snapshot de sessão no Redis
 * (issue #11).
 */
@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtCfg: JwtConfig;

  private static readonly ARGON_OPTS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19_456, // 19 MiB — recomendação OWASP
    timeCost: 2,
    parallelism: 1,
  };

  /** Hash Argon2 real de uma senha aleatória, calculado uma vez no boot e usado
   *  no caminho "usuário inexistente" para manter o login em tempo ~constante. */
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly sessions: SessionCacheService,
    config: ConfigService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokens: Repository<RefreshTokenEntity>,
  ) {
    this.jwtCfg = config.getOrThrow<JwtConfig>('jwt');
    this.dummyHash = argon2.hash(randomUUID(), AuthService.ARGON_OPTS);
  }

  async register(input: RegisterInput): Promise<TokenPair> {
    const passwordHash = await argon2.hash(input.password, AuthService.ARGON_OPTS);
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      cpf: input.cpf,
      phone: input.phone,
      role: UserRole.CUSTOMER,
    });
    this.logger.log(`Novo usuário registrado: ${user.id}`);
    return this.issueTokens(user.id, user.email, user.role, randomUUID());
  }

  async login(input: LoginInput, ctx: RequestContext = {}): Promise<TokenPair> {
    const user = await this.users.findByEmailWithSecret(input.email);
    // Verificação em caminho constante: mesmo sem usuário, roda um verify "dummy"
    // para não vazar existência de e-mail por timing.
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const valid = await argon2.verify(hash, input.password).catch(() => false);

    if (!user || !valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    if (user.status === 'suspended') {
      throw new UnauthorizedException('Conta suspensa');
    }

    await this.users.markLoggedIn(user.id);
    await this.sessions.save({
      userId: user.id,
      email: user.email,
      role: user.role,
      issuedAt: Date.now(),
    });
    return this.issueTokens(user.id, user.email, user.role, randomUUID(), ctx);
  }

  async refresh(refreshToken: string, ctx: RequestContext = {}): Promise<TokenPair> {
    const payload = await this.verifyRefresh(refreshToken);
    const tokenHash = AuthService.sha256(refreshToken);
    const stored = await this.refreshTokens.findOne({ where: { tokenHash } });

    if (!stored) {
      throw new UnauthorizedException('Refresh token desconhecido');
    }

    // Detecção de reuso: token já revogado sendo reapresentado => comprometido.
    if (stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      await this.refreshTokens.update(
        { familyId: stored.familyId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      await this.sessions.invalidate(payload.sub);
      throw new UnauthorizedException('Sessão inválida — refaça o login');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);

    return this.issueTokens(user.id, user.email, user.role, stored.familyId, ctx);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefresh(refreshToken).catch(() => null);
    if (!payload) return;
    await this.refreshTokens.update(
      { familyId: payload.familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    await this.sessions.invalidate(payload.sub);
  }

  async validateAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = await this.jwt.verifyAsync<JwtAccessPayload>(token, {
        secret: this.jwtCfg.accessSecret,
      });
      if (payload.type !== 'access') throw new Error('tipo inválido');
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('Token de acesso inválido');
    }
  }

  // ── internos ───────────────────────────────────────────────

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
    familyId: string,
    ctx: RequestContext = {},
  ): Promise<TokenPair> {
    const accessPayload: JwtAccessPayload = { sub: userId, email, role, type: 'access' };
    const refreshPayload: JwtRefreshPayload = { sub: userId, familyId, type: 'refresh' };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.jwtCfg.accessSecret,
      expiresIn: this.jwtCfg.accessTtl,
    });
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.jwtCfg.refreshSecret,
      expiresIn: this.jwtCfg.refreshTtl,
    });

    try {
      await this.refreshTokens.insert({
        userId,
        familyId,
        tokenHash: AuthService.sha256(refreshToken),
        userAgent: ctx.userAgent ?? null,
        ip: ctx.ip ?? null,
        expiresAt: new Date(Date.now() + this.jwtCfg.refreshTtl * 1000),
      });
    } catch {
      // Colisão de hash é praticamente impossível; sinaliza bug de rotação.
      throw new ConflictException('Falha ao registrar sessão');
    }

    return { accessToken, refreshToken, expiresIn: this.jwtCfg.accessTtl };
  }

  private async verifyRefresh(token: string): Promise<JwtRefreshPayload> {
    try {
      const payload = await this.jwt.verifyAsync<JwtRefreshPayload>(token, {
        secret: this.jwtCfg.refreshSecret,
      });
      if (payload.type !== 'refresh') throw new Error('tipo inválido');
      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  private static sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
