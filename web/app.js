'use strict';

const API = '/api/v1';
const STORE_KEY = 'gastrohub.session';

const $ = (sel) => document.querySelector(sel);
const logEl = $('#log');

/** @type {{accessToken:string, refreshToken:string, expiresIn:number, issuedAt:number}|null} */
let session = loadSession();

// ─────────────────────────────────────────────── helpers

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(tokens) {
  session = tokens ? { ...tokens, issuedAt: Date.now() } : null;
  if (session) localStorage.setItem(STORE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORE_KEY);
  renderSession();
}

function decodeJwt(token) {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function shorten(str, head = 24, tail = 12) {
  if (!str || str.length <= head + tail + 1) return str || '—';
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

function now() {
  return new Date().toLocaleTimeString('pt-BR');
}

/** Faz uma request à API e registra tudo no console visual. */
async function api(method, path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && session) headers.Authorization = `Bearer ${session.accessToken}`;

  const entry = document.createElement('div');
  entry.className = 'entry';
  entry.innerHTML = `<div class="line"><span class="t">${now()}</span>
    <span class="badge m">${method}</span><span>${path}</span><span class="pending">…</span></div>`;
  logEl.prepend(entry);

  let res, json;
  try {
    res = await fetch(API + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
  } catch (err) {
    entry.querySelector('.pending').outerHTML = `<span class="s5">falha de rede</span>`;
    entry.insertAdjacentHTML('beforeend', `<pre>${String(err)}</pre>`);
    throw err;
  }

  const cls = res.ok ? 's2' : res.status >= 500 ? 's5' : 's4';
  entry.querySelector('.pending').outerHTML = `<span class="${cls}">${res.status} ${res.statusText}</span>`;
  entry.insertAdjacentHTML('beforeend', `<pre>${escapeHtml(JSON.stringify(json, null, 2))}</pre>`);

  return { res, json };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function formData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((k) => {
    if (data[k] === '' || data[k] == null) delete data[k];
  });
  return data;
}

// ─────────────────────────────────────────────── render

let expTimer = null;

function renderSession() {
  const has = !!session;
  $('#sessionEmpty').hidden = has;
  $('#sessionData').hidden = !has;
  if (!has) {
    if (expTimer) clearInterval(expTimer);
    return;
  }

  const payload = decodeJwt(session.accessToken) || {};
  $('#sUser').textContent = payload.email || payload.sub || '—';
  $('#sRole').textContent = payload.role || '—';
  $('#sAccess').textContent = shorten(session.accessToken);
  $('#sRefresh').textContent = shorten(session.refreshToken);

  const tick = () => {
    const expMs = (payload.exp ? payload.exp * 1000 : session.issuedAt + session.expiresIn * 1000);
    const left = Math.round((expMs - Date.now()) / 1000);
    $('#sExp').textContent = left > 0 ? `${left}s` : 'expirado — use Refresh';
    $('#sExp').className = left > 0 ? '' : 's4';
  };
  tick();
  if (expTimer) clearInterval(expTimer);
  expTimer = setInterval(tick, 1000);
}

async function pollHealth() {
  const box = $('#health');
  try {
    const r = await fetch(`${API}/health`);
    const j = await r.json().catch(() => ({}));
    const pg = j?.details?.postgres?.status || j?.info?.postgres?.status;
    const redis = j?.details?.redis?.reachable;
    box.className = 'health ok';
    $('#healthText').textContent = `API ok · postgres ${pg || '?'} · redis ${redis ? 'ok' : 'off'}`;
  } catch {
    box.className = 'health bad';
    $('#healthText').textContent = 'API fora do ar';
  }
}

// ─────────────────────────────────────────────── events

$('#formRegister').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = formData(e.target);
  const { res, json } = await api('POST', '/auth/register', data);
  if (res.ok) {
    saveSession(json);
    $('#formLogin').email.value = data.email;
  }
});

$('#formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = formData(e.target);
  const { res, json } = await api('POST', '/auth/login', data);
  if (res.ok) saveSession(json);
});

$('#btnMe').addEventListener('click', () => api('GET', '/auth/me', null, true));

$('#btnRefresh').addEventListener('click', async () => {
  if (!session) return;
  const { res, json } = await api('POST', '/auth/refresh', { refreshToken: session.refreshToken });
  if (res.ok) saveSession(json);
  else saveSession(null);
});

$('#btnLogout').addEventListener('click', async () => {
  if (session) await api('POST', '/auth/logout', { refreshToken: session.refreshToken });
  saveSession(null);
});

$('#btnClear').addEventListener('click', () => {
  logEl.innerHTML = '';
});

// ─────────────────────────────────────────────── boot

renderSession();
pollHealth();
setInterval(pollHealth, 10000);
