import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508200007341755637656254 implements MigrationInterface {
    name = 'Mig202508200007341755637656254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" ADD "main_team_id" integer NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "main_team_id"`);
    }

}
