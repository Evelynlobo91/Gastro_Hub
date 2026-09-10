import { FormEvent, useState } from 'react';
import { api } from '../../shared/api';
import { errorText, readForm } from './read-form';
import type { TokenPair } from './session-store';

interface Props {
  onSession: (tokens: TokenPair) => void;
  prefillEmail?: string;
}

export function LoginForm({ onSession, prefillEmail }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const data = readForm(e.currentTarget);
      const { ok, data: res } = await api<TokenPair & { message?: string | string[] }>(
        'POST',
        '/auth/login',
        { body: data },
      );
      if (ok) onSession(res);
      else setErr(errorText(res.message, 'Credenciais inválidas'));
    } catch {
      setErr('Não foi possível falar com a API.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card">
      <h2>2 · Login</h2>
      <p className="hint">
        <code>POST /api/v1/auth/login</code>
      </p>
      <form onSubmit={submit} autoComplete="off" key={prefillEmail}>
        <label>
          E-mail
          <input
            name="email"
            type="email"
            required
            defaultValue={prefillEmail}
            placeholder="ana@exemplo.com"
          />
        </label>
        <label>
          Senha
          <input name="password" type="text" required defaultValue="Senha#Forte123" />
        </label>
        <button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        {err && <p className="err">{err}</p>}
      </form>
      <p className="hint">
        Admin do seed: <code>admin@gastrohub.local</code> / <code>Admin#Gastro123</code>
      </p>
    </article>
  );
}
