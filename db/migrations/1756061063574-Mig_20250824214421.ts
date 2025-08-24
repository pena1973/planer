import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508242144211756061063574 implements MigrationInterface {
    name = 'Mig202508242144211756061063574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "billId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "date_from"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "date_from" character varying`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "date_to"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "date_to" character varying`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "billable_team_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "team_id" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "team_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "billable_team_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "date_to"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "date_to" date`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "date_from"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "date_from" date`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "billId" DROP NOT NULL`);
    }

}
