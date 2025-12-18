import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512172119391765999181393 implements MigrationInterface {
    name = 'Mig202512172119391765999181393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" RENAME COLUMN "customer_id" TO "stripe_customer_id"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "invoice_pdf_url"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "receipt_pdf_url"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" ADD "receipt_pdf_url" text`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "invoice_pdf_url" text`);
        await queryRunner.query(`ALTER TABLE "clients" RENAME COLUMN "stripe_customer_id" TO "customer_id"`);
    }

}
