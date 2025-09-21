import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509111232591757583181355 implements MigrationInterface {
    name = 'Mig202509111232591757583181355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "invoices" ("id" SERIAL NOT NULL, "stripe_invoice_id" character varying(64) NOT NULL, "stripe_invoice_number" character varying(64), "stripe_customer_id" character varying(64), "team_id" integer NOT NULL, "status" character varying(16) NOT NULL DEFAULT 'paid', "currency" character(3) NOT NULL, "amount_subtotal" bigint NOT NULL, "tax_amount" bigint NOT NULL, "amount_total" bigint NOT NULL, "hosted_invoice_url" text, "invoice_pdf_url" text, "customer_email" character varying(255), "customer_country" character(2), "customer_vat_id" character varying(64), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "paid_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0ddf8494c8665a57c670287ccd" ON "invoices" ("stripe_invoice_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0ddf8494c8665a57c670287ccd"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
    }

}
