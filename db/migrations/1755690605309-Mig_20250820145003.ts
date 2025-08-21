import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508201450031755690605309 implements MigrationInterface {
    name = 'Mig202508201450031755690605309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" RENAME COLUMN "main_team_id" TO "main_team"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "main_team"`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "main_team" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "main_team"`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "main_team" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "teams" RENAME COLUMN "main_team" TO "main_team_id"`);
    }

}
