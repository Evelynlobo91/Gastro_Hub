import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { decodeJwt, shorten } from '../../shared/jwt';
import type { Session, TokenPair } from './session-store';

interface Props {
  session: Session | null;
  onSession: (tokens: TokenPair | null) => void;
}

export function SessionPanel({ session, onSession }: Props) {
  const [left, setLeft] = useState(0);

  const payload = session ? decodeJwt(session.accessToken) : null;

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const expMs = payload?.exp
        ? payload.exp * 1000
        : session.issuedAt + session.expiresIn * 1000;
      setLeft(Math.round((expMs - Date.now()) / 1000));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session, payload]);

  if (!session) {
    return (
      <article className="card">
        <h2>3 · Sessão</h2>
        <p className="hint">Nenhuma sessão ativa. Faça login ou cadastro.</p>
      </article>
    );
  }

  const me = () => api('GET', '/auth/me', { token: session.accessToken });

  const refresh = async () => {
    const { ok, data } = await api<TokenPair>('POST', '/auth/refresh', {
      body: { refreshToken: session.refreshToken },
    });
    onSession(ok ? data : null);
  };

  const logout = async () => {
    await api('POST', '/auth/logout', { body: { refreshToken: session.refreshToken } });
    onSession(null);
  };

  return (
    <article className="card">
      <h2>3 · Sessão</h2>
      <dl>
        <dt>Usuário</dt>
        <dd>{payload?.email ?? payload?.sub ?? '—'}</dd>
        <dt>Papel</dt>
        <dd>{payload?.role ?? '—'}</dd>
        <dt>Access expira em</dt>
        <dd className={left > 0 ? '' : 'warn'}>{left > 0 ? `${left}s` : 'expirado — Refresh'}</dd>
        <dt>access</dt>
        <dd className="mono">{shorten(session.accessToken)}</dd>
        <dt>refresh</dt>
        <dd className="mono">{shorten(session.refreshToken)}</dd>
      </dl>
      <div className="actions">
        <button onClick={me}>GET /auth/me</button>
        <button onClick={refresh}>Refresh</button>
        <button className="ghost" onClick={logout}>
          Logout
        </button>
      </div>
    </article>
  );
}
