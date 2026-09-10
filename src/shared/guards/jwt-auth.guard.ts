import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SessionCacheService } from '../cache/session-cache.service';
import { JwtConfig } from '../config/configuration';
import { AuthenticatedUser, JwtAccessPayload } from '../../contracts';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global do API Gateway / BFF (issue #9).
 *
 * 1. Rotas marcadas com @Public() passam direto.
 * 2. Valida a assinatura/expiração do access token (JWT stateless — issue #7).
 * 3. Consulta o cache de sessão no Redis (issue #11): se houver snapshot e ele
 *    divergir do token (ex.: logout/troca de papel), recusa. Se o Redis estiver
 *    fora, segue apenas com o JWT (degradação graciosa).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly accessSecret: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly sessions: SessionCacheService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<JwtConfig>('jwt').accessSecret;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Token de acesso ausente');

    let payload: JwtAccessPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtAccessPayload>(token, {
        secret: this.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Tipo de token inválido');
    }

    const snapshot = await this.sessions.get(payload.sub);
    if (snapshot && snapshot.role !== payload.role) {
      throw new UnauthorizedException('Sessão desatualizada, refaça o login');
    }

    const user: AuthenticatedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    (request as Request & { user: AuthenticatedUser }).user = user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && value ? value : null;
  }
}
