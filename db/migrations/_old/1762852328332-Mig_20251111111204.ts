import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202511111112041762852328332 implements MigrationInterface {
    name = 'Mig202511111112041762852328332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" ADD "notes" text NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "notes"`);
    }

}
