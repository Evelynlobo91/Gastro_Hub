# Arquitetura — Gastro_Hub

> Fase 0 · issue #4 — Definição da stack técnica e estrutura de módulos do monólito.

## Decisão: Monólito Modular

Equipe de 3 pessoas, prazo curto — microsserviços distribuídos seriam
overengineering (risco #1 do projeto). Adotamos um **monólito modular** em
NestJS: um único deploy, um único banco, mas com fronteiras de módulo explícitas
e comunicação entre módulos **somente via contratos** (`src/contracts/`), nunca
importando `*.service.ts` ou `*.entity.ts` de outro módulo.

## Stack

| Camada | Tecnologia | Porquê |
| --- | --- | --- |
| Runtime / framework | Node 22 + NestJS 10 (TypeScript) | DI, modularidade, ecossistema |
| Banco de dados | PostgreSQL 16 | ACID, `CHECK` para regras de negócio, `JSONB` para atributos variáveis por marca |
| ORM / migrations | TypeORM 0.3 (migrations em SQL) | Integração nativa com NestJS; SQL explícito onde importa (índices parciais, `pgcrypto`) |
| Cache / resiliência | Redis 7 (ioredis) | Cache de sessão e leitura de cardápio; fallback quando o banco oscila (issue #11) |
| Mensageria | RabbitMQ 3.13 | Fila assíncrona para pagamento/delivery a partir da Fase 2 (risco #3) |
| Autenticação | JWT stateless + Argon2id + `pgcrypto` | Senha com hash forte; dados sensíveis (CPF, telefone) cifrados em repouso — LGPD (issue #7) |
| Empacotamento | Docker Compose (dev) | `api + postgres + redis + rabbitmq` sobem com um comando |
| CI/CD | GitHub Actions | lint → build → migrations → testes unitários → e2e |

## Estrutura de pastas — slices verticais por feature

Regra: **cada feature é uma pasta autocontida** (controller + service + dto +
entities + testes juntos). Infra transversal fica em `src/shared/`. Uma feature só
conhece outra através de `src/contracts/`.

```
src/
├── main.ts                    bootstrap (helmet, ValidationPipe, prefixo /api/v1, Swagger)
├── app.module.ts              raiz — compõe shared + features
├── contracts/                 DTOs/interfaces entre features (issue #5) — a fronteira
├── shared/                    infra transversal, sem regra de negócio
│   ├── config/                configuração tipada + validação de env no boot
│   ├── database/
│   │   ├── data-source.ts     DataSource compartilhado (runtime + CLI de migrations)
│   │   ├── database.module.ts
│   │   ├── migrations/        migrations versionadas (issue #6)
│   │   └── seeds/             seed de desenvolvimento
│   ├── cache/                 Redis + SessionCacheService (issue #11) — módulo global
│   ├── crypto/                PgCryptoService — cifragem em repouso via pgcrypto (issue #7)
│   ├── decorators/            @Public, @Roles, @CurrentUser
│   ├── guards/                JwtAuthGuard, RolesGuard (issue #9)
│   ├── filters/               HttpExceptionFilter (envelope de erro padrão)
│   └── interceptors/          LoggingInterceptor
└── features/
    ├── gateway/               API Gateway / BFF: roteamento, guards globais, /health (issue #9)
    ├── auth/                  cadastro, login, refresh rotativo, logout (issue #7, #10)
    │   ├── auth.module.ts  auth.controller.ts  auth.service.ts  auth.service.spec.ts
    │   ├── dto/               RegisterDto, LoginDto, RefreshDto
    │   └── entities/          RefreshTokenEntity
    ├── users/                 usuários + perfis (issue #8) — users.service + entities/
    ├── brands/                marcas (entidade base; expandida no Catálogo)
    ├── catalog/     (Fase 2)  cardápios segmentados por marca — issues #12/#13
    ├── orders/      (Fase 2)  carrinho unificado + subcomandas — issues #14/#16
    ├── inventory/   (Fase 2)  ficha técnica + baixa automática — issues #15/#17
    ├── loyalty/     (Fase 2)  acúmulo/resgate de pontos — issues #18/#22
    ├── delivery/    (Fase 3)  pedido remoto, rota — issues #19/#21
    └── marketplace/ (Fase 3)  transferência entre marcas — issues #20/#23
```

### Front (`frontend/`) — mesmas slices

```
frontend/src/
├── main.tsx
├── app/                       App.tsx + styles.css (composição da página)
├── shared/                    api.ts (fetch + barramento), jwt.ts (decode/format)
└── features/
    ├── auth/                  RegisterForm, LoginForm, SessionPanel, session-store
    ├── health/               HealthPill
    └── request-log/          RequestLog (console de requisições)
```

## Cross-cutting concerns (ordem de execução no Gateway)

1. `ThrottlerGuard` — rate limit por IP (`THROTTLE_*`).
2. `JwtAuthGuard` — valida o access token; rotas `@Public()` passam direto; consulta
   o snapshot de sessão no Redis e degrada para "só JWT" se o Redis estiver fora.
3. `RolesGuard` — checa `@Roles(...)`.
4. `HttpExceptionFilter` — corpo de erro `{ statusCode, error, message, path, timestamp }`.
5. `LoggingInterceptor` — log `METHOD path status durationms`.

## Fluxo de autenticação (issue #7)

```
register → Argon2id(hash) → users.create (tx: user + profile + pgcrypto CPF/tel) → par de tokens
login    → verify Argon2 (tempo ~constante) → markLoggedIn → SessionCache.save → par de tokens
refresh  → verifica refresh JWT → busca hash SHA-256 no banco →
           se revogado/expirado ⇒ revoga a família inteira (detecção de reuso) →
           senão rotaciona (revoga atual, emite novo na mesma família)
logout   → revoga a família + invalida a sessão no Redis
```

Access token: 15 min. Refresh token: 14 dias, rotativo, com detecção de reuso.
