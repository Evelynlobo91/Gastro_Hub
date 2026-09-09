import type { JwtPayload, Session, TokenPair } from './types';

const KEY = 'gastrohub.session';

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

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function shorten(value: string, head = 20, tail = 10): string {
  if (!value || value.length <= head + tail + 1) return value || '—';
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
