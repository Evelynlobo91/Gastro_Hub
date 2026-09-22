import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 2 — issue #15: schema do módulo de Estoque.
 *
 * Tabelas criadas:
 *   ingredients       — insumos (compartilháveis ou exclusivos por marca)
 *   recipe_components — ficha técnica: insumos por produto (PK composta)
 *   stock_levels      — saldo atual por insumo por marca (UNIQUE + coluna gerada)
 *   stock_transactions — histórico imutável de movimentações
 *
 * Decisões de design:
 *   - stock_levels.below_minimum é GENERATED ALWAYS AS (on_hand < minimum) STORED
 *     → alerta de estoque baixo garantido pelo banco, sem lógica duplicada na app.
 *   - stock_transactions é append-only (sem UPDATE/DELETE) — auditoria completa.
 *   - stock_movement_type enum criado aqui (primeiro uso).
 *   - CHECK (quantity > 0) em recipe_components e (minimum >= 0) em stock_levels.
 *   - trigger set_updated_at reutilizado (já existe desde Fase 1) para ingredients.
 */
export class InventorySchema1725840300000 implements MigrationInterface {
  name = 'InventorySchema1725840300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── enum de movimentação ────────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE stock_movement_type AS ENUM
          ('purchase', 'consumption', 'adjustment', 'transfer_in', 'transfer_out', 'waste');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ── ingredients ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE ingredients (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id    uuid,
        name        text NOT NULL,
        base_unit   text NOT NULL,
        active      boolean NOT NULL DEFAULT true,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_ingredients_brand FOREIGN KEY (brand_id)
          REFERENCES brands (id) ON DELETE CASCADE,
        CONSTRAINT chk_ingredients_base_unit CHECK (base_unit IN ('g', 'ml', 'un'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_ingredients_brand ON ingredients (brand_id) WHERE active = true`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ingredients_shared ON ingredients (id) WHERE brand_id IS NULL AND active = true`,
    );

    // ── recipe_components ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE recipe_components (
        product_id      uuid NOT NULL,
        ingredient_id   uuid NOT NULL,
        quantity        numeric(10, 4) NOT NULL,
        unit            text NOT NULL,
        PRIMARY KEY (product_id, ingredient_id),
        CONSTRAINT chk_recipe_quantity CHECK (quantity > 0),
        CONSTRAINT fk_recipe_product FOREIGN KEY (product_id)
          REFERENCES products (id) ON DELETE CASCADE,
        CONSTRAINT fk_recipe_ingredient FOREIGN KEY (ingredient_id)
          REFERENCES ingredients (id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_recipe_components_product ON recipe_components (product_id)`,
    );

    // ── stock_levels ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE stock_levels (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ingredient_id   uuid NOT NULL,
        brand_id        uuid NOT NULL,
        on_hand         numeric(12, 4) NOT NULL DEFAULT 0,
        minimum         numeric(12, 4) NOT NULL DEFAULT 0,
        below_minimum   boolean GENERATED ALWAYS AS (on_hand < minimum) STORED,
        CONSTRAINT chk_stock_minimum CHECK (minimum >= 0),
        CONSTRAINT chk_stock_on_hand_non_negative CHECK (on_hand >= 0),
        CONSTRAINT uq_stock_levels_ingredient_brand UNIQUE (ingredient_id, brand_id),
        CONSTRAINT fk_stock_ingredient FOREIGN KEY (ingredient_id)
          REFERENCES ingredients (id) ON DELETE RESTRICT,
        CONSTRAINT fk_stock_brand FOREIGN KEY (brand_id)
          REFERENCES brands (id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_stock_levels_brand ON stock_levels (brand_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_stock_levels_low ON stock_levels (brand_id) WHERE below_minimum = true`,
    );

    // ── stock_transactions ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE stock_transactions (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        stock_level_id   uuid NOT NULL,
        order_id         uuid,
        type             stock_movement_type NOT NULL,
        quantity         numeric(12, 4) NOT NULL,
        balance_after    numeric(12, 4) NOT NULL,
        created_at       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_stock_tx_level FOREIGN KEY (stock_level_id)
          REFERENCES stock_levels (id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_stock_tx_level ON stock_transactions (stock_level_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_stock_tx_order ON stock_transactions (order_id) WHERE order_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_stock_tx_created ON stock_transactions (created_at DESC)`,
    );

    // trigger updated_at para ingredients
    await queryRunner.query(`
      CREATE TRIGGER trg_ingredients_updated_at BEFORE UPDATE ON ingredients
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_ingredients_updated_at ON ingredients`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS stock_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS stock_levels`);
    await queryRunner.query(`DROP TABLE IF EXISTS recipe_components`);
    await queryRunner.query(`DROP TABLE IF EXISTS ingredients`);
    await queryRunner.query(`DROP TYPE IF EXISTS stock_movement_type`);
  }
}
