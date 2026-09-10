import { FormEvent, useState } from 'react';
import { api } from '../../shared/api';
import { errorText, readForm } from './read-form';
import type { TokenPair } from './session-store';

interface Props {
  onSession: (tokens: TokenPair) => void;
  onEmail?: (email: string) => void;
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
        setErr(errorText(res.message, 'Falha no cadastro'));
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
