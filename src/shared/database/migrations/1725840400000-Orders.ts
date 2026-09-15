import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: cria tabelas do OrdersModule (Fase 2).
 * Tabelas: orders, order_items, sub_orders, payments.
 * Enums: order_status, sub_order_status, payment_status, payment_method.
 */
export class Orders1725840400000 implements MigrationInterface {
  name = 'Orders1725840400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── enums ──────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM (
          'PENDING','CONFIRMED','PREPARING','ON_THE_WAY','DELIVERED','CANCELLED','COMPLETED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE sub_order_status AS ENUM (
          'PENDING','PREPARING','READY','ON_THE_WAY','DELIVERED','CANCELLED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM (
          'PENDING','PROCESSING','COMPLETED','FAILED','REFUNDED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payment_method AS ENUM (
          'CREDIT_CARD','DEBIT_CARD','PIX','CASH','ONLINE_TRANSFER'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ── orders ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id              uuid          NOT NULL REFERENCES users(id),
        customer_name        varchar(255)  NOT NULL,
        customer_phone       varchar(255)  NOT NULL,
        customer_address     text,
        delivery_instructions varchar(255),
        status               order_status  NOT NULL DEFAULT 'PENDING',
        total_amount_cents   integer       NOT NULL DEFAULT 0,
        delivery_fee_cents   integer       NOT NULL DEFAULT 0,
        subtotal_cents       integer       NOT NULL DEFAULT 0,
        payment_method       varchar(50),
        notes                text,
        restaurant_branch_id uuid,
        estimated_delivery_at timestamptz,
        created_at           timestamptz   NOT NULL DEFAULT now(),
        updated_at           timestamptz   NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)`,
    );

    // ── order_items ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id             uuid         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id           uuid         REFERENCES products(id) ON DELETE SET NULL,
        product_name         varchar(255) NOT NULL,
        unit_price_cents     integer      NOT NULL,
        quantity             integer      NOT NULL,
        subtotal_cents       integer      NOT NULL,
        special_instructions text,
        customizations       jsonb,
        created_at           timestamptz  NOT NULL DEFAULT now(),
        updated_at           timestamptz  NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id)`,
    );

    // ── sub_orders ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sub_orders (
        id                      uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id                uuid             NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        restaurant_id           uuid             REFERENCES restaurants(id) ON DELETE SET NULL,
        restaurant_name         varchar(255)     NOT NULL,
        restaurant_branch_name  varchar(255)     NOT NULL,
        status                  sub_order_status NOT NULL DEFAULT 'PENDING',
        total_amount_cents      integer          NOT NULL DEFAULT 0,
        subtotal_cents          integer          NOT NULL DEFAULT 0,
        delivery_fee_cents      integer          NOT NULL DEFAULT 0,
        estimated_ready_at      timestamptz,
        created_at              timestamptz      NOT NULL DEFAULT now(),
        updated_at              timestamptz      NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sub_orders_order_id ON sub_orders (order_id)`,
    );

    // ── payments ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id         uuid           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        payment_method   payment_method NOT NULL,
        status           payment_status NOT NULL DEFAULT 'PENDING',
        amount_cents     integer        NOT NULL,
        transaction_id   varchar(255),
        payment_gateway  varchar(255),
        payment_data     text,
        card_last_four   varchar(4),
        refund_amount_cents integer     NOT NULL DEFAULT 0,
        paid_at          timestamptz,
        refunded_at      timestamptz,
        created_at       timestamptz    NOT NULL DEFAULT now(),
        updated_at       timestamptz    NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payments`);
    await queryRunner.query(`DROP TABLE IF EXISTS sub_orders`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS sub_order_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_status`);
  }
}
