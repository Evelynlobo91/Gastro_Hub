import { MigrationInterface, QueryRunner } from 'typeorm';

export class Restaurants1725840350000 implements MigrationInterface {
  name = 'Restaurants1725840350000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id   uuid REFERENCES brands(id) ON DELETE CASCADE,
        name       varchar(255) NOT NULL,
        address    text,
        phone      varchar(50),
        active     boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS restaurants`);
  }
}
