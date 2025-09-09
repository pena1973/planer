import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508242221111756063273032 implements MigrationInterface {
    name = 'Mig202508242221111756063273032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "balance" ADD "date" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "balance" ADD "date" date NOT NULL`);
    }

}
