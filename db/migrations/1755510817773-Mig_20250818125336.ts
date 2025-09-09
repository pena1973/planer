import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508181253361755510817773 implements MigrationInterface {
    name = 'Mig202508181253361755510817773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" ADD "active" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "active"`);
    }

}
