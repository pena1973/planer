import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508311844351756655077045 implements MigrationInterface {
    name = 'Mig202508311844351756655077045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password_changed_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_changed_at"`);
    }

}
