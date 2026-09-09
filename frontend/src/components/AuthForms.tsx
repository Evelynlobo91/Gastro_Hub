import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import type { TokenPair } from '../lib/types';

interface Props {
  onSession: (tokens: TokenPair) => void;
  onEmail?: (email: string) => void;
  prefillEmail?: string;
}

function readForm(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    const s = String(v).trim();
    if (s) out[k] = s;
  });
  return out;
}

export function RegisterForm({ onSession, onEmail }: Props) {
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
        '/auth/register',
        { body: data },
      );
      if (ok) {
        onEmail?.(data.email);
        onSession(res);
      } else {
        setErr(([] as string[]).concat(res.message ?? 'Falha no cadastro').join(' · '));
      }
    } catch {
      setErr('Não foi possível falar com a API.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card">
      <h2>1 · Cadastro</h2>
      <p className="hint">
        <code>POST /api/v1/auth/register</code>
      </p>
      <form onSubmit={submit} autoComplete="off">
        <label>
          Nome completo
          <input name="fullName" required minLength={2} defaultValue="Ana Souza" />
        </label>
        <label>
          E-mail
          <input name="email" type="email" required placeholder="ana@exemplo.com" />
        </label>
        <label>
          Senha
          <input name="password" type="text" required minLength={10} defaultValue="Senha#Forte123" />
          <small>mín. 10, com maiúscula, minúscula e número</small>
        </label>
        <div className="row">
          <label>
            CPF <small>(opcional, cifrado)</small>
            <input name="cpf" inputMode="numeric" pattern="\d{11}" placeholder="11 dígitos" />
          </label>
          <label>
            Telefone <small>(opcional, cifrado)</small>
            <input name="phone" inputMode="numeric" pattern="\d{10,13}" placeholder="11987654321" />
          </label>
        </div>
        <button disabled={busy}>{busy ? 'Enviando…' : 'Cadastrar'}</button>
        {err && <p className="err">{err}</p>}
      </form>
    </article>
  );
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
      else setErr(([] as string[]).concat(res.message ?? 'Credenciais inválidas').join(' · '));
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
          <input name="email" type="email" required defaultValue={prefillEmail} placeholder="ana@exemplo.com" />
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
