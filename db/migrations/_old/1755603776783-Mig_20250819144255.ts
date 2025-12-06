import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508191442551755603776783 implements MigrationInterface {
    name = 'Mig202508191442551755603776783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" RENAME COLUMN "fileContent" TO "coment"`);
        await queryRunner.query(`ALTER TABLE "bills" ALTER COLUMN "title" SET DEFAULT 'Invoice'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" ALTER COLUMN "title" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "bills" RENAME COLUMN "coment" TO "fileContent"`);
    }

}
