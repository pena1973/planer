import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508221514491755864891526 implements MigrationInterface {
    name = 'Mig202508221514491755864891526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "count_date"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" ADD "count_date" character varying NOT NULL DEFAULT ''`);
    }

}
