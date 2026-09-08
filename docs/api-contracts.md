# Contratos de API entre Módulos

> Fase 0 · issue #5 — DTOs/interfaces entre módulos.

## Regra de arquitetura

Um módulo **nunca** importa `*.service.ts`, `*.entity.ts` ou `*.repository.ts`
de outro módulo. A dependência é sempre sobre uma **interface + token** de
`src/contracts/`. O módulo provedor registra a implementação sob o token; o
consumidor injeta o token.

```ts
// provedor (auth.module.ts)
providers: [AuthService, { provide: AUTH_SERVICE, useExisting: AuthService }]

// consumidor
constructor(@Inject(AUTH_SERVICE) private readonly auth: IAuthService) {}
```

Isso mantém o monólito "desmontável": se um módulo virar serviço próprio no
futuro, só a implementação do contrato muda (chamada local → chamada de rede).

## Índice de contratos (`src/contracts/`)

| Arquivo | Token | Interface | Provedor | Fase |
| --- | --- | --- | --- | --- |
| `common.contract.ts` | — | `Money`, `PaginatedResult<T>`, `PaginationQuery`, `AuditTimestamps`, `UUID` | — | 0 |
| `auth.contract.ts` | `AUTH_SERVICE` | `IAuthService` | AuthModule | 1 |
| `users.contract.ts` | `USERS_SERVICE` | `IUsersService` | UsersModule | 1 |
| `catalog.contract.ts` | `CATALOG_SERVICE` | `ICatalogService` | CatalogModule | 2 |
| `orders.contract.ts` | `ORDERS_SERVICE` | `IOrdersService` | OrdersModule | 2 |
| `inventory.contract.ts` | `INVENTORY_SERVICE` | `IInventoryService` | InventoryModule | 2 |
| `loyalty.contract.ts` | `LOYALTY_SERVICE` | `ILoyaltyService` | LoyaltyModule | 2/3 |

## Tipos base

```ts
interface Money { amountCents: number; currency: 'BRL' }
interface PaginationQuery { page?: number; pageSize?: number }
interface PaginatedResult<T> { items: T[]; total: number; page: number; pageSize: number }
```

Convenções: dinheiro sempre em centavos; datas como `Date`; identificadores `UUID` (string).

## Dependências previstas entre módulos

```
Gateway   → Auth (validação de requisição)
Auth      → Users
Orders    → Catalog (preço/disponibilidade), Inventory (baixa), Loyalty (acúmulo), Payment
Inventory → Catalog (ficha técnica ↔ produto)
Delivery  → Orders
Marketplace → Inventory (níveis de estoque, custo)
```

Ciclos são proibidos. `Orders → Loyalty` é unidirecional: Loyalty reage a eventos
de pedido (via chamada de contrato agora; via RabbitMQ a partir da Fase 2).

## Contratos HTTP já publicados (Fase 1)

Base: `/api/v1` · erros no formato `{ statusCode, error, message, path, timestamp }`.

| Método | Rota | Auth | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| GET | `/health` | pública | — | status de `postgres` e `redis` |
| POST | `/auth/register` | pública | `{ email, password, fullName, cpf?, phone? }` | `201 { accessToken, refreshToken, expiresIn }` |
| POST | `/auth/login` | pública | `{ email, password }` | `200 { accessToken, refreshToken, expiresIn }` |
| POST | `/auth/refresh` | pública | `{ refreshToken }` | `200 { accessToken, refreshToken, expiresIn }` |
| POST | `/auth/logout` | pública | `{ refreshToken }` | `204` |
| GET | `/auth/me` | Bearer | — | `200 { id, email, fullName, role, status, profile }` |

Regras de senha: mínimo 10 caracteres, com maiúscula, minúscula e número.
CPF: 11 dígitos (armazenado cifrado). Rate limit do login: 10 req/min por IP.

Especificação viva: `GET /api/v1/docs` (Swagger, apenas fora de produção).
