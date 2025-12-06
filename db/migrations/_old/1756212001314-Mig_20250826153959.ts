import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508261539591756212001314 implements MigrationInterface {
    name = 'Mig202508261539591756212001314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" RENAME COLUMN "billableTeamNumber" TO "billable_team_number"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_rows" RENAME COLUMN "billable_team_number" TO "billableTeamNumber"`);
    }

}
