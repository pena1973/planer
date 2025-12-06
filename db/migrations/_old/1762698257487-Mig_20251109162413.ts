import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202511091624131762698257487 implements MigrationInterface {
    name = 'Mig202511091624131762698257487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "main_team"`);
        await queryRunner.query(`ALTER TABLE "leads" ADD "company" character varying(250) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "leads" ADD "time" character varying(150) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "leads" ADD "locale" character varying NOT NULL DEFAULT 'en'`);
        await queryRunner.query(`ALTER TABLE "leads" ADD "agree" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "email" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "phone" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "phone" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "message" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "message" SET DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "message" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "message" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "phone" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "phone" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "email" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "agree"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "locale"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "time"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "company"`);
        await queryRunner.query(`ALTER TABLE "leads" ADD "main_team" character varying NOT NULL DEFAULT ''`);
    }

}
