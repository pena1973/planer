import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508281217301756372651860 implements MigrationInterface {
    name = 'Mig202508281217301756372651860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "price" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "price"`);
    }

}
