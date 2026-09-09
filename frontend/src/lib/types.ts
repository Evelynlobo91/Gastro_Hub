export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Session extends TokenPair {
  issuedAt: number;
}

export interface ApiCall {
  id: number;
  time: string;
  method: string;
  path: string;
  status: number | null;
  ok: boolean;
  body: unknown;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  type?: string;
}
