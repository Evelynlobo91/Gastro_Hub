import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 3 — issues #20/#23: tabela brand_transfers (marketplace interno).
 *
 * Regras de negócio garantidas por CHECK no banco:
 *   - from_brand_id <> to_brand_id (não pode transferir para si mesmo)
 *   - quantity > 0
 *   - transfer_price_cents > unit_cost_cents (regra central do projeto)
 *
 * Status da transferência controlado por enum brand_transfer_status.
 * Índices para consultas por marca origem, destino e ingrediente.
 */
export class MarketplaceBrandTransfers1725840450000 implements MigrationInterface {
  name = 'MarketplaceBrandTransfers1725840450000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE brand_transfer_status AS ENUM
          ('requested', 'approved', 'shipped', 'received', 'rejected');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE brand_transfers (
        id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        from_brand_id         uuid NOT NULL,
        to_brand_id           uuid NOT NULL,
        ingredient_id         uuid NOT NULL,
        quantity              numeric(12, 4) NOT NULL,
        unit_cost_cents       int NOT NULL,
        transfer_price_cents  int NOT NULL,
        status                brand_transfer_status NOT NULL DEFAULT 'requested',
        created_at            timestamptz NOT NULL DEFAULT now(),
        updated_at            timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_brand_transfers_different_brands
          CHECK (from_brand_id <> to_brand_id),
        CONSTRAINT chk_brand_transfers_quantity_positive
          CHECK (quantity > 0),
        CONSTRAINT chk_brand_transfers_price_above_cost
          CHECK (transfer_price_cents > unit_cost_cents),
        CONSTRAINT fk_brand_transfers_from_brand FOREIGN KEY (from_brand_id)
          REFERENCES brands (id) ON DELETE RESTRICT,
        CONSTRAINT fk_brand_transfers_to_brand FOREIGN KEY (to_brand_id)
          REFERENCES brands (id) ON DELETE RESTRICT,
        CONSTRAINT fk_brand_transfers_ingredient FOREIGN KEY (ingredient_id)
          REFERENCES ingredients (id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_brand_transfers_from ON brand_transfers (from_brand_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_brand_transfers_to ON brand_transfers (to_brand_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_brand_transfers_ingredient ON brand_transfers (ingredient_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_brand_transfers_status ON brand_transfers (status)`,
    );

    await queryRunner.query(`
      CREATE TRIGGER trg_brand_transfers_updated_at BEFORE UPDATE ON brand_transfers
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_brand_transfers_updated_at ON brand_transfers`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS brand_transfers`);
    await queryRunner.query(`DROP TYPE IF EXISTS brand_transfer_status`);
  }
}
