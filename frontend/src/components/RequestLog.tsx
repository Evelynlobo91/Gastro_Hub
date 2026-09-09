import { useEffect, useRef, useState } from 'react';
import { onApiCall } from '../lib/api';
import type { ApiCall } from '../lib/types';

export function RequestLog() {
  const [calls, setCalls] = useState<ApiCall[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => onApiCall((call) => setCalls((prev) => [call, ...prev].slice(0, 40))), []);
  useEffect(() => {
    box.current?.scrollTo({ top: 0 });
  }, [calls]);

  const cls = (c: ApiCall) =>
    c.status == null ? 's5' : c.status < 300 ? 's2' : c.status < 500 ? 's4' : 's5';

  return (
    <section className="card console">
      <div className="console-head">
        <h2>Console de requisições</h2>
        <button className="ghost" onClick={() => setCalls([])}>
          limpar
        </button>
      </div>
      <div className="log" ref={box}>
        {calls.length === 0 && <p className="hint">As chamadas à API aparecem aqui.</p>}
        {calls.map((c) => (
          <div className="entry" key={c.id}>
            <div className="line">
              <span className="t">{c.time}</span>
              <span className="badge">{c.method}</span>
              <span>{c.path}</span>
              <span className={cls(c)}>{c.status ?? 'ERR'}</span>
            </div>
            <pre>{JSON.stringify(c.body, null, 2)}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}
