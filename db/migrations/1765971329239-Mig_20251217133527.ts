import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512171335271765971329239 implements MigrationInterface {
  name = 'Mig202512171335271765971329239'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoices" ADD "receipt_pdf_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "receipt_pdf_url"`);
  }
}
