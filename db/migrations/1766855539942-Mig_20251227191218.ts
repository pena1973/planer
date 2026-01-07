import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512271912181766855539942 implements MigrationInterface {
    name = 'Mig202512271912181766855539942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_agree" DROP COLUMN "signed_at"`);
        await queryRunner.query(`ALTER TABLE "user_agree" ADD "signed_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_agree" DROP COLUMN "signed_at"`);
        await queryRunner.query(`ALTER TABLE "user_agree" ADD "signed_at" TIMESTAMP`);
    }

}
