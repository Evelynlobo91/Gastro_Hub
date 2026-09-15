import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 2 — issue #13: tabelas de catálogo (categories e products).
 *
 * Decisões de design:
 *  - UNIQUE (brand_id, name) em categories → cada marca tem namespace próprio de categorias.
 *  - CHECK (price_cents >= 0) em products → regra de negócio garantida no banco.
 *  - Índice composto (brand_id, available) → query principal do cardápio público.
 *  - Índice GIN em products.attributes → filtro eficiente por atributos JSONB variáveis.
 *  - ON DELETE RESTRICT em category_id → não deixa remover categoria com produtos ativos.
 *  - trigger set_updated_at reutilizado (já existe desde Fase 1).
 */
export class CatalogCategoriesAndProducts1725840200000 implements MigrationInterface {
  name = 'CatalogCategoriesAndProducts1725840200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── categories ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE categories (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id    uuid NOT NULL,
        name        text NOT NULL,
        sort_order  int  NOT NULL DEFAULT 0,
        active      boolean NOT NULL DEFAULT true,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_categories_brand FOREIGN KEY (brand_id)
          REFERENCES brands (id) ON DELETE CASCADE,
        CONSTRAINT uq_categories_brand_name UNIQUE (brand_id, name)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_categories_brand ON categories (brand_id) WHERE active = true`,
    );

    // ── products ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE products (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id      uuid NOT NULL,
        category_id   uuid NOT NULL,
        name          text NOT NULL,
        description   text,
        price_cents   int NOT NULL,
        currency      char(3) NOT NULL DEFAULT 'BRL',
        available     boolean NOT NULL DEFAULT true,
        attributes    jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_products_price_non_negative CHECK (price_cents >= 0),
        CONSTRAINT fk_products_brand FOREIGN KEY (brand_id)
          REFERENCES brands (id) ON DELETE CASCADE,
        CONSTRAINT fk_products_category FOREIGN KEY (category_id)
          REFERENCES categories (id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_products_brand_available ON products (brand_id, available)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_products_attributes_gin ON products USING GIN (attributes)`,
    );

    // Reutiliza trigger já criado na Fase 1 para manter updated_at
    for (const table of ['categories', 'products']) {
      await queryRunner.query(`
        CREATE TRIGGER trg_${table}_updated_at BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['categories', 'products']) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table}`);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
  }
}
