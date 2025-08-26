import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508262302361756238558045 implements MigrationInterface {
    name = 'Mig202508262302361756238558045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" ADD "VAT" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "VAT"`);
    }

}
