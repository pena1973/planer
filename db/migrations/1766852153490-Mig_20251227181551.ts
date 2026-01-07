import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512271815511766852153490 implements MigrationInterface {
    name = 'Mig202512271815511766852153490'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_agree" ADD "agreement_text_snapshot" text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "user_agree" ADD "agreement_locale" character varying(5) NOT NULL DEFAULT 'ru'`);
        await queryRunner.query(`ALTER TABLE "user_agree" ADD "signed_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_agree" DROP COLUMN "signed_at"`);
        await queryRunner.query(`ALTER TABLE "user_agree" DROP COLUMN "agreement_locale"`);
        await queryRunner.query(`ALTER TABLE "user_agree" DROP COLUMN "agreement_text_snapshot"`);
    }

}
