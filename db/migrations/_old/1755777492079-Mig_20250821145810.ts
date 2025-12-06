import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508211458101755777492079 implements MigrationInterface {
    name = 'Mig202508211458101755777492079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" DROP COLUMN "summa"`);
        await queryRunner.query(`ALTER TABLE "balance" ADD "summa" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" DROP COLUMN "summa"`);
        await queryRunner.query(`ALTER TABLE "balance" ADD "summa" character varying NOT NULL DEFAULT '0'`);
    }

}
