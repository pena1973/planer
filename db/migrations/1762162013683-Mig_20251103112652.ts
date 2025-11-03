import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202511031126521762162013683 implements MigrationInterface {
  name = 'Mig202511031126521762162013683';

  public async up(qr: QueryRunner): Promise<void> {
    // 1) Меняем типы "на месте" — без DROP/ADD и без NULL
    await qr.query(`ALTER TABLE "t_cards"           ALTER COLUMN "id"       TYPE BIGINT USING "id"::bigint`);
    await qr.query(`ALTER TABLE "t_cards"           ALTER COLUMN "idc"      TYPE BIGINT USING "idc"::bigint`);

    await qr.query(`ALTER TABLE "t_card_operations" ALTER COLUMN "tcard_id" TYPE BIGINT USING "tcard_id"::bigint`);
    await qr.query(`ALTER TABLE "t_card_products"   ALTER COLUMN "tcard_id" TYPE BIGINT USING "tcard_id"::bigint`);
    await qr.query(`ALTER TABLE "t_card_stages"     ALTER COLUMN "tcard_id" TYPE BIGINT USING "tcard_id"::bigint`);

    
    await qr.query(`ALTER TABLE "products"          ALTER COLUMN "tcard_id" TYPE BIGINT USING "tcard_id"::bigint`);

    await qr.query(`ALTER TABLE "unit_loads"        ALTER COLUMN "id_tCard" TYPE BIGINT USING "id_tCard"::bigint`);

    // ВАЖНО: не добавляй здесь повторно уникальный индекс для team_schedule —
    // он уже был добавлен предыдущей миграцией и вызовет duplicate constraint.
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE "unit_loads"        ALTER COLUMN "id_tCard" TYPE INTEGER USING "id_tCard"::integer`);

    
    await qr.query(`ALTER TABLE "products"          ALTER COLUMN "tcard_id" TYPE INTEGER USING "tcard_id"::integer`);

    await qr.query(`ALTER TABLE "t_card_stages"     ALTER COLUMN "tcard_id" TYPE INTEGER USING "tcard_id"::integer`);
    await qr.query(`ALTER TABLE "t_card_products"   ALTER COLUMN "tcard_id" TYPE INTEGER USING "tcard_id"::integer`);
    await qr.query(`ALTER TABLE "t_card_operations" ALTER COLUMN "tcard_id" TYPE INTEGER USING "tcard_id"::integer`);

    await qr.query(`ALTER TABLE "t_cards"           ALTER COLUMN "idc"      TYPE INTEGER USING "idc"::integer`);
    await qr.query(`ALTER TABLE "t_cards"           ALTER COLUMN "id"       TYPE INTEGER USING "id"::integer`);
  }
}
