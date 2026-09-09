# Gastro_Hub

Plataforma que cobre o ciclo completo do pedido em um espaço **multimarca**:
cadastro e autenticação do cliente, navegação por cardápios segmentados por marca,
carrinho unificado, pagamento consolidado, divisão do pedido em subcomandas por
cozinha, acompanhamento em tempo real e apuração financeira separada por
estabelecimento.

Arquitetura: **monólito modular** em NestJS + PostgreSQL + Redis + RabbitMQ.
Ver [`docs/architecture.md`](docs/architecture.md), [`docs/DER.md`](docs/DER.md) e
[`docs/api-contracts.md`](docs/api-contracts.md).

## Status do desenvolvimento

| Fase | Épico | Situação |
| --- | --- | --- |
| 0 — Modelagem e Preparação | #31 | ✅ stack, estrutura de módulos, DER, contratos, migrations iniciais |
| 1 — Fundação (infra + auth) | #32 | ✅ ambiente sobe + login funcional (auth, gateway, cache Redis, testes) |
| 2 — Módulos Core | #33 | ⏳ catálogo, pedidos, estoque, pagamento, fidelidade |
| 3 — Recursos Avançados | #34 | ⏳ delivery, marketplace interno |
| 4 — Testes e Resiliência | #35 | ⏳ |
| 5 — Deploy e Documentação | #36 | ⏳ |

## Pré-requisitos

- Node.js 22+
- Docker + Docker Compose (para Postgres/Redis/RabbitMQ)

## Subir o ambiente

### Opção A — tudo em containers, um comando

```bash
cp .env.example .env
docker compose up --build
```

Sobe **front + API + Postgres + Redis + RabbitMQ**, aplica as migrations e deixa
tudo com hot-reload:

| O quê | URL |
| --- | --- |
| **Front (console de teste)** | **http://localhost:5173** |
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/api/v1/docs |
| Health | http://localhost:3000/api/v1/health |
| RabbitMQ (painel) | http://localhost:15672 — gastrohub / gastrohub |

### Opção B — sem Docker para o app (só as dependências em container)

```bash
cp .env.example .env
docker compose up -d postgres redis rabbitmq   # ou use um Postgres local e ajuste .env

# API (terminal 1)
npm install
npm run migration:run
npm run seed            # opcional: marcas + admin de exemplo
npm run start:dev       # http://localhost:3000/api/v1

# Front (terminal 2)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

O front (`frontend/`, Vite + React) roda em **:5173** e faz proxy de `/api` para
a API em **:3000** — sem CORS no dev. Só o PostgreSQL é obrigatório; sem Redis a
API continua funcionando (o cache de sessão degrada, issue #11).

## Scripts

| Comando | O quê |
| --- | --- |
| `npm run start:dev` | API com hot-reload |
| `npm run build` | Compila para `dist/` |
| `npm test` | Testes unitários |
| `npm run test:cov` | Testes unitários + cobertura |
| `npm run test:e2e` | Testes ponta-a-ponta (precisa de Postgres + migrations) |
| `npm run lint` | ESLint + Prettier (`--fix`) |
| `npm run migration:run` / `:revert` | Aplica / desfaz migrations |
| `npm run migration:generate -- src/database/migrations/<Nome>` | Gera migration a partir das entidades |
| `npm run seed` | Popula dados de desenvolvimento |

## Fluxo rápido de autenticação

```bash
BASE=http://localhost:3000/api/v1

curl -sX POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"ana@exemplo.com","password":"Senha#Forte123","fullName":"Ana Souza"}'

curl -sX POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"ana@exemplo.com","password":"Senha#Forte123"}'

curl -s $BASE/auth/me -H "Authorization: Bearer <accessToken>"
```

## CI

GitHub Actions (`.github/workflows/ci.yml`): a cada push/PR na `main` roda
lint → build → migrations → testes unitários → testes e2e, com serviços
Postgres e Redis efêmeros.

## Equipe

- **Evelyn** — autenticação, fidelidade, segurança/LGPD
- **Filipe** — infra, gateway, catálogo, pedidos, delivery
- **Barbara** — modelo de dados, schema, estoque, marketplace (revisa toda alteração de schema)
