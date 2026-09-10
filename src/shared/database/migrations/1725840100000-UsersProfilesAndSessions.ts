import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 1 — issue #8: schema e tabelas de usuários/perfis + índices de performance.
 * issue #7: dados sensíveis (CPF, telefone) cifrados em repouso via pgcrypto (colunas bytea).
 * issue #11: refresh tokens persistidos como hash para revogação; o cache de sessão
 *            "quente" fica no Redis (camada de resiliência), este é o registro durável.
 */
export class UsersProfilesAndSessions1725840100000 implements MigrationInterface {
  name = 'UsersProfilesAndSessions1725840100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email              citext NOT NULL,
        password_hash      text NOT NULL,
        full_name          text NOT NULL,
        cpf_enc            bytea,
        phone_enc          bytea,
        role               user_role NOT NULL DEFAULT 'customer',
        status             user_status NOT NULL DEFAULT 'pending_verification',
        email_verified_at  timestamptz,
        last_login_at      timestamptz,
        created_at         timestamptz NOT NULL DEFAULT now(),
        updated_at         timestamptz NOT NULL DEFAULT now(),
        deleted_at         timestamptz,
        CONSTRAINT uq_users_email UNIQUE (email),
        CONSTRAINT chk_users_full_name_not_blank CHECK (length(btrim(full_name)) > 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_users_role ON users (role) WHERE deleted_at IS NULL`);
    await queryRunner.query(
      `CREATE INDEX idx_users_status ON users (status) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_users_last_login_at ON users (last_login_at DESC NULLS LAST)`,
    );
    await queryRunner.query(`CREATE INDEX idx_users_active ON users (id) WHERE deleted_at IS NULL`);

    await queryRunner.query(`
      CREATE TABLE profiles (
        id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           uuid NOT NULL,
        birth_date        date,
        default_brand_id  uuid,
        address           jsonb,
        marketing_opt_in  boolean NOT NULL DEFAULT false,
        created_at        timestamptz NOT NULL DEFAULT now(),
        updated_at        timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_profiles_user UNIQUE (user_id),
        CONSTRAINT fk_profiles_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_profiles_default_brand FOREIGN KEY (default_brand_id)
          REFERENCES brands (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_profiles_default_brand ON profiles (default_brand_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      uuid NOT NULL,
        token_hash   text NOT NULL,
        family_id    uuid NOT NULL,
        user_agent   text,
        ip           inet,
        expires_at   timestamptz NOT NULL,
        revoked_at   timestamptz,
        created_at   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash),
        CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id)`);
    await queryRunner.query(`CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at) WHERE revoked_at IS NULL`,
    );

    // Trigger genérico para manter updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql
    `);
    for (const table of ['users', 'profiles', 'brands']) {
      await queryRunner.query(`
        CREATE TRIGGER trg_${table}_updated_at BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['users', 'profiles', 'brands']) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table}`);
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at()`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS profiles`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
