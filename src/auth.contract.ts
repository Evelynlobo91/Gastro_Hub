import { UUID } from './common.contract';

/** Papéis de acesso — espelha o enum `user_role` do PostgreSQL. */
export enum UserRole {
  CUSTOMER = 'customer',
  KITCHEN_STAFF = 'kitchen_staff',
  BRAND_ADMIN = 'brand_admin',
  PLATFORM_ADMIN = 'platform_admin',
  COURIER = 'courier',
}

/** Payload assinado no access token (JWT). */
export interface JwtAccessPayload {
  sub: UUID;
  email: string;
  role: UserRole;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: UUID;
  familyId: UUID;
  /** Identificador único do token — evita colisão de hash quando duas
   *  rotações da mesma família acontecem dentro do mesmo segundo (o `iat`
   *  do JWT só tem resolução de segundo). */
  jti: UUID;
  type: 'refresh';
}

/** Identidade do requisitante, anexada a `request.user` pelo API Gateway (issue #9). */
export interface AuthenticatedUser {
  id: UUID;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos até o access token expirar
}

/** Snapshot de sessão mantido no Redis (issue #11 — camada de resiliência). */
export interface SessionSnapshot {
  userId: UUID;
  email: string;
  role: UserRole;
  issuedAt: number;
}

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface IAuthService {
  register(input: RegisterInput): Promise<TokenPair>;
  login(input: LoginInput, ctx?: RequestContext): Promise<TokenPair>;
  refresh(refreshToken: string, ctx?: RequestContext): Promise<TokenPair>;
  logout(refreshToken: string): Promise<void>;
  validateAccessToken(token: string): Promise<AuthenticatedUser>;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  cpf?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}
