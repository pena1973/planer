import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508242146421756061204136 implements MigrationInterface {
    name = 'Mig202508242146421756061204136'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_from" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_from" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_to" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_to" SET DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_to" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_to" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_from" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ALTER COLUMN "date_from" DROP NOT NULL`);
    }

}
