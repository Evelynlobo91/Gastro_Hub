import type { ApiCall } from './types';

/** Base da API. Em dev o Vite faz proxy de /api -> http://localhost:3000. */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

let counter = 0;
type Listener = (call: ApiCall) => void;
const listeners = new Set<Listener>();

export function onApiCall(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

export async function api<T = unknown>(
  method: string,
  path: string,
  opts: { body?: unknown; token?: string } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const record: ApiCall = {
    id: ++counter,
    time: new Date().toLocaleTimeString('pt-BR'),
    method,
    path,
    status: null,
    ok: false,
    body: null,
  };

  try {
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    record.status = res.status;
    record.ok = res.ok;
    record.body = data;
    listeners.forEach((l) => l({ ...record }));
    return { ok: res.ok, status: res.status, data: data as T };
  } catch (err) {
    record.body = { error: 'network', message: String(err) };
    listeners.forEach((l) => l({ ...record }));
    throw err;
  }
}
