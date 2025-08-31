import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508311748081756651690679 implements MigrationInterface {
    name = 'Mig202508311748081756651690679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isSystem" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isSystem"`);
    }

}
