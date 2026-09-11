export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  type?: string;
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
