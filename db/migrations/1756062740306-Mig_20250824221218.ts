import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508242212181756062740306 implements MigrationInterface {
    name = 'Mig202508242212181756062740306'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "activeDays" smallint NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "activeDays"`);
    }

}
