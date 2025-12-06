import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508221200591755853261285 implements MigrationInterface {
    name = 'Mig202508221200591755853261285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" ADD "count_date" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "count_date"`);
    }

}
