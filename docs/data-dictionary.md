# Dicionário de Dados — Gastro_Hub

> A versão **formal e completa** deste documento é entregue na Fase 5 (issue #29).
> Aqui ficam apenas as tabelas já criadas por migration (Fase 0/1).

Fonte da verdade do schema: `src/database/migrations/`.

## Tipos enumerados

| Tipo | Valores |
| --- | --- |
| `user_role` | `customer`, `kitchen_staff`, `brand_admin`, `platform_admin`, `courier` |
| `user_status` | `pending_verification`, `active`, `suspended` |

## `brands`

| Coluna | Tipo | Nulo | Padrão | Descrição |
| --- | --- | --- | --- | --- |
| id | uuid | não | `gen_random_uuid()` | PK |
| name | text | não | | Nome comercial da marca |
| slug | citext | não | | Identificador em URL; UNIQUE |
| legal_name | text | sim | | Razão social |
| cnpj_enc | bytea | sim | | CNPJ cifrado (`pgp_sym_encrypt`) |
| active | boolean | não | `true` | Marca operante |
| settings | jsonb | não | `{}` | Configurações variáveis da marca |
| created_at | timestamptz | não | `now()` | |
| updated_at | timestamptz | não | `now()` | Mantida por trigger |
| deleted_at | timestamptz | sim | | Soft delete |

Índices: `uq_brands_slug` UNIQUE(slug); `idx_brands_active` (active) WHERE deleted_at IS NULL.

## `users`

| Coluna | Tipo | Nulo | Padrão | Descrição |
| --- | --- | --- | --- | --- |
| id | uuid | não | `gen_random_uuid()` | PK |
| email | citext | não | | Login; UNIQUE, case-insensitive |
| password_hash | text | não | | Hash Argon2id; não retornado por padrão |
| full_name | text | não | | `CHECK` não-vazio |
| cpf_enc | bytea | sim | | CPF cifrado em repouso (LGPD) |
| phone_enc | bytea | sim | | Telefone cifrado em repouso |
| role | user_role | não | `customer` | Papel de acesso |
| status | user_status | não | `pending_verification` | Situação da conta |
| email_verified_at | timestamptz | sim | | Data de verificação do e-mail |
| last_login_at | timestamptz | sim | | Último login bem-sucedido |
| created_at / updated_at | timestamptz | não | `now()` | `updated_at` via trigger |
| deleted_at | timestamptz | sim | | Soft delete |

Índices: `uq_users_email` UNIQUE(email); `idx_users_role`, `idx_users_status`,
`idx_users_active` — parciais WHERE deleted_at IS NULL; `idx_users_last_login_at` (desc).

## `profiles`

| Coluna | Tipo | Nulo | Padrão | Descrição |
| --- | --- | --- | --- | --- |
| id | uuid | não | `gen_random_uuid()` | PK |
| user_id | uuid | não | | FK→users (ON DELETE CASCADE); UNIQUE (1:1) |
| birth_date | date | sim | | Data de nascimento |
| default_brand_id | uuid | sim | | FK→brands (ON DELETE SET NULL) |
| address | jsonb | sim | | Endereço(s); estrutura flexível |
| marketing_opt_in | boolean | não | `false` | Consentimento de marketing (LGPD) |
| created_at / updated_at | timestamptz | não | `now()` | |

Índice: `idx_profiles_default_brand` (default_brand_id).

## `refresh_tokens`

| Coluna | Tipo | Nulo | Padrão | Descrição |
| --- | --- | --- | --- | --- |
| id | uuid | não | `gen_random_uuid()` | PK |
| user_id | uuid | não | | FK→users (ON DELETE CASCADE) |
| token_hash | text | não | | SHA-256 do refresh token; UNIQUE |
| family_id | uuid | não | | Família de rotação; reuso revoga a família toda |
| user_agent | text | sim | | UA do cliente na emissão |
| ip | inet | sim | | IP de origem na emissão |
| expires_at | timestamptz | não | | Expiração |
| revoked_at | timestamptz | sim | | Revogação (rotação, logout, reuso) |
| created_at | timestamptz | não | `now()` | |

Índices: `uq_refresh_tokens_hash` UNIQUE(token_hash); `idx_refresh_tokens_user`,
`idx_refresh_tokens_family`; `idx_refresh_tokens_expires` (expires_at) WHERE revoked_at IS NULL.

## Objetos auxiliares

- `set_updated_at()` — função `plpgsql` que atualiza `NEW.updated_at = now()`.
- Triggers `trg_<tabela>_updated_at` em `users`, `profiles`, `brands`.
- Extensões: `pgcrypto`, `citext`, `uuid-ossp`.
