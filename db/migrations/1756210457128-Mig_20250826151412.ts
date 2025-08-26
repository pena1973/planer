import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508261514121756210457128 implements MigrationInterface {
    name = 'Mig202508261514121756210457128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" RENAME COLUMN "billable_team_id" TO "billableTeamNumber"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "billableTeamNumber"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "billableTeamNumber" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" DROP COLUMN "billableTeamNumber"`);
        await queryRunner.query(`ALTER TABLE "bill_rows" ADD "billableTeamNumber" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "bill_rows" RENAME COLUMN "billableTeamNumber" TO "billable_team_id"`);
    }

}
