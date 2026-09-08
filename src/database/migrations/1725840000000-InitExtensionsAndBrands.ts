import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 0 — issue #6: migrations iniciais.
 * Habilita extensões (pgcrypto p/ cifragem em repouso — LGPD, citext p/ e-mails/slugs),
 * cria os tipos enumerados e a tabela `brands` (marcas), referência para o restante do DER.
 */
export class InitExtensionsAndBrands1725840000000 implements MigrationInterface {
  name = 'InitExtensionsAndBrands1725840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM
          ('customer', 'kitchen_staff', 'brand_admin', 'platform_admin', 'courier');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('pending_verification', 'active', 'suspended');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE brands (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name          text NOT NULL,
        slug          citext NOT NULL,
        legal_name    text,
        cnpj_enc      bytea,
        active        boolean NOT NULL DEFAULT true,
        settings      jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now(),
        deleted_at    timestamptz,
        CONSTRAINT uq_brands_slug UNIQUE (slug)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_brands_active ON brands (active) WHERE deleted_at IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS brands`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
  }
}
