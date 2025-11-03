import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202511031557401762178261879 implements MigrationInterface {
  name = 'Mig202511031557401762178261879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "t_cards"
      ALTER COLUMN "idc" TYPE integer
      USING ("idc")::integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "t_cards"
      ALTER COLUMN "idc" TYPE bigint
      USING ("idc")::bigint
    `);
  }
}
