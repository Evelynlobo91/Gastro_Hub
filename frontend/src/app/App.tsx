import { useCallback, useState } from 'react';
import { LoginForm } from '../features/auth/LoginForm';
import { RegisterForm } from '../features/auth/RegisterForm';
import { SessionPanel } from '../features/auth/SessionPanel';
import { loadSession, persistSession, type Session, type TokenPair } from '../features/auth/session-store';
import { HealthPill } from '../features/health/HealthPill';
import { RequestLog } from '../features/request-log/RequestLog';

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
