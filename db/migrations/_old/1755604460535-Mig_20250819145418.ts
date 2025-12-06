import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508191454181755604460535 implements MigrationInterface {
    name = 'Mig202508191454181755604460535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "coment"`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "coment" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "coment"`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "coment" text NOT NULL`);
    }

}
