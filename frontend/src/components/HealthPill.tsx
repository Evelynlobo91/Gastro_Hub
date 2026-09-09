import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface HealthState {
  status: 'checking' | 'ok' | 'down';
  detail: string;
}

export function HealthPill() {
  const [health, setHealth] = useState<HealthState>({ status: 'checking', detail: 'verificando…' });

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const { ok, data } = await api<Record<string, any>>('GET', '/health');
        if (!alive) return;
        const pg = data?.details?.postgres?.status ?? data?.info?.postgres?.status ?? '?';
        const redis = data?.details?.redis?.reachable ? 'ok' : 'off';
        setHealth({
          status: ok ? 'ok' : 'down',
          detail: `postgres ${pg} · redis ${redis}`,
        });
      } catch {
        if (alive) setHealth({ status: 'down', detail: 'API fora do ar' });
      }
    };
    check();
    const t = setInterval(check, 10_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className={`pill ${health.status}`}>
      <span className="dot" />
      <span>{health.status === 'ok' ? `API ok · ${health.detail}` : health.detail}</span>
    </div>
  );
}
