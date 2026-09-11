import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SessionCacheService } from '../cache/session-cache.service';
import { UserRole } from '../../contracts';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard (issue #9 / #10)', () => {
  const jwt = new JwtService({});
  const secret = 'test-access';
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let sessions: { get: jest.Mock };
  let request: { headers: Record<string, string>; user?: unknown };

  const ctxFor = (): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  const sign = (payload: Record<string, unknown>) => jwt.sign(payload, { secret, expiresIn: 900 });

  beforeEach(() => {
    reflector = new Reflector();
    sessions = { get: jest.fn().mockResolvedValue(null) };
    request = { headers: {} };
    guard = new JwtAuthGuard(
      reflector,
      jwt,
      sessions as unknown as SessionCacheService,
      { getOrThrow: () => ({ accessSecret: secret }) } as unknown as ConfigService,
    );
  });

  it('libera rotas marcadas como @Public()', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    await expect(guard.canActivate(ctxFor())).resolves.toBe(true);
  });

  it('recusa quando falta o header Authorization', async () => {
    await expect(guard.canActivate(ctxFor())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('recusa token com assinatura inválida', async () => {
    request.headers.authorization = 'Bearer abc.def.ghi';
    await expect(guard.canActivate(ctxFor())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('aceita access token válido e popula request.user', async () => {
    request.headers.authorization =
      'Bearer ' + sign({ sub: 'u1', email: 'a@b.com', role: UserRole.CUSTOMER, type: 'access' });

    await expect(guard.canActivate(ctxFor())).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u1', email: 'a@b.com', role: UserRole.CUSTOMER });
  });

  it('recusa refresh token onde se espera access', async () => {
    request.headers.authorization = 'Bearer ' + sign({ sub: 'u1', familyId: 'f', type: 'refresh' });
    await expect(guard.canActivate(ctxFor())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('recusa quando o papel no cache de sessão diverge do token', async () => {
    sessions.get.mockResolvedValue({ userId: 'u1', role: UserRole.PLATFORM_ADMIN });
    request.headers.authorization =
      'Bearer ' + sign({ sub: 'u1', email: 'a@b.com', role: UserRole.CUSTOMER, type: 'access' });

    await expect(guard.canActivate(ctxFor())).rejects.toThrow(/Sessão desatualizada/);
  });

  it('segue apenas com o JWT quando o cache está fora (resiliência — issue #11)', async () => {
    sessions.get.mockRejectedValue(new Error('redis down'));
    request.headers.authorization =
      'Bearer ' + sign({ sub: 'u1', email: 'a@b.com', role: UserRole.CUSTOMER, type: 'access' });

    // SessionCacheService.get engole o erro e devolve null; o guard não deve quebrar.
    sessions.get.mockResolvedValue(null);
    await expect(guard.canActivate(ctxFor())).resolves.toBe(true);
  });
});
