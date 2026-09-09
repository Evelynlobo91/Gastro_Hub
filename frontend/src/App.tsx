import { useCallback, useState } from 'react';
import { HealthPill } from './components/HealthPill';
import { LoginForm, RegisterForm } from './components/AuthForms';
import { RequestLog } from './components/RequestLog';
import { SessionPanel } from './components/SessionPanel';
import { loadSession, persistSession } from './lib/session';
import type { Session, TokenPair } from './lib/types';

export function App() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [lastEmail, setLastEmail] = useState<string | undefined>();

  const onSession = useCallback((tokens: TokenPair | null) => {
    setSession(persistSession(tokens));
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="logo">🍽️</span>
          <div>
            <h1>Gastro_Hub</h1>
            <p>Console de teste — Fase 1 (infra + autenticação)</p>
          </div>
        </div>
        <HealthPill />
      </header>

      <main>
        <section className="grid">
          <RegisterForm onSession={onSession} onEmail={setLastEmail} />
          <LoginForm onSession={onSession} prefillEmail={lastEmail} />
          <SessionPanel session={session} onSession={onSession} />
        </section>
        <RequestLog />
      </main>

      <footer>
        <a href="/api/v1/docs" target="_blank" rel="noreferrer">
          Swagger
        </a>
        <a href="/api/v1/health" target="_blank" rel="noreferrer">
          /health
        </a>
        <span>Vite + React · API NestJS em :3000</span>
      </footer>
    </>
  );
}
