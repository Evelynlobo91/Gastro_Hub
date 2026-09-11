# Gastro_Hub — Front de teste (Vite + React)

Console para **testar e validar** a API do Gastro_Hub. Não é o produto final —
é uma ferramenta de validação do marco da Fase 1 ("login funcional").

## Rodar isolado

Precisa da API rodando em `http://localhost:3000` (ver README da raiz).

```bash
cd frontend
npm install
npm run dev
```

Abre em **http://localhost:5173**. O Vite faz proxy de `/api` para a API,
então não há CORS no desenvolvimento.

## Variáveis

| Var | Onde | Padrão |
| --- | --- | --- |
| `VITE_API_PROXY` | build/dev (Node) | `http://localhost:3000` — alvo do proxy `/api` |
| `VITE_API_URL` | runtime (browser) | `/api/v1` — sobrescreve a base se quiser chamar a API direto |

## O que dá para fazer

- **Cadastro** (`POST /auth/register`) e **Login** (`POST /auth/login`)
- Painel de **sessão**: papel, contagem regressiva do access token, `GET /auth/me`,
  **Refresh** (rotação) e **Logout**
- **Health** no topo (poll em `/health`) e **console** com todas as requisições
- Tokens ficam em `localStorage` (sobrevivem ao reload)
