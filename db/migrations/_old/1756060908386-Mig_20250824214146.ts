import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508242141461756060908386 implements MigrationInterface {
    name = 'Mig202508242141461756060908386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "paid"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "bill"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "discaunt"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "billId" integer`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "discount" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_from" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_to" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "billable_team_id"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "billable_team_id" integer`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "amount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "carency" SET DEFAULT 'EUR'`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "team_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "team_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "carency" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "amount" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "billable_team_id"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "billable_team_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_to" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_from" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "billId"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "discaunt" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "bill" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "paid" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "active" boolean NOT NULL DEFAULT true`);
    }

}
