import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeliveryAndFulfillmentSchema1725840500000 implements MigrationInterface {
  name = 'DeliveryAndFulfillmentSchema1725840500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "fulfillment_type_enum" AS ENUM ('DINE_IN', 'PICKUP', 'DELIVERY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "delivery_status_enum" AS ENUM ('PENDING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "fulfillment_type" "fulfillment_type_enum" NOT NULL DEFAULT 'DELIVERY',
      ADD COLUMN IF NOT EXISTS "table_number" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "delivery_region_id" UUID;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "delivery_zones" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "restaurant_id" UUID NOT NULL,
        "zone_name" VARCHAR(100) NOT NULL,
        "min_distance_km" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "max_distance_km" NUMERIC(5,2) NOT NULL,
        "delivery_fee_cents" INTEGER NOT NULL DEFAULT 0,
        "estimated_time_minutes" INTEGER NOT NULL DEFAULT 30,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "deliveries" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "restaurant_id" UUID,
        "courier_id" UUID,
        "courier_name" VARCHAR(255),
        "courier_phone" VARCHAR(50),
        "fulfillment_type" "fulfillment_type_enum" NOT NULL DEFAULT 'DELIVERY',
        "status" "delivery_status_enum" NOT NULL DEFAULT 'PENDING',
        "delivery_fee_cents" INTEGER NOT NULL DEFAULT 0,
        "delivery_address" TEXT,
        "delivery_region_id" UUID REFERENCES "delivery_zones"("id") ON DELETE SET NULL,
        "table_number" VARCHAR(50),
        "pickup_notice_sent" BOOLEAN NOT NULL DEFAULT false,
        "assigned_at" TIMESTAMPTZ,
        "picked_up_at" TIMESTAMPTZ,
        "delivered_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "deliveries";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "delivery_zones";`);
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "delivery_region_id",
      DROP COLUMN IF EXISTS "table_number",
      DROP COLUMN IF EXISTS "fulfillment_type";
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "delivery_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "fulfillment_type_enum";`);
  }
}
