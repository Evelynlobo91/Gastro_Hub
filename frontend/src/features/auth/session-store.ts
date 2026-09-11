const KEY = 'gastrohub.session';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Session extends TokenPair {
  issuedAt: number;
}

export function loadSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function persistSession(tokens: TokenPair | null): Session | null {
  if (!tokens) {
    localStorage.removeItem(KEY);
    return null;
  }
  const session: Session = { ...tokens, issuedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}
