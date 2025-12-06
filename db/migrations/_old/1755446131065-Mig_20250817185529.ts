import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508171855291755446131065 implements MigrationInterface {
    name = 'Mig202508171855291755446131065'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "baners" DROP COLUMN "dateFrom"`);
        await queryRunner.query(`ALTER TABLE "baners" DROP COLUMN "dateTo"`);
        await queryRunner.query(`ALTER TABLE "baners" ADD "date_from" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "baners" ADD "date_to" date NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "baners" DROP COLUMN "date_to"`);
        await queryRunner.query(`ALTER TABLE "baners" DROP COLUMN "date_from"`);
        await queryRunner.query(`ALTER TABLE "baners" ADD "dateTo" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "baners" ADD "dateFrom" date NOT NULL`);
    }

}
