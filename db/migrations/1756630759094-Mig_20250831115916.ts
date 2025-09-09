import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508311159161756630759094 implements MigrationInterface {
    name = 'Mig202508311159161756630759094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" ADD "transaction_id" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" DROP COLUMN "transaction_id"`);
    }

}
