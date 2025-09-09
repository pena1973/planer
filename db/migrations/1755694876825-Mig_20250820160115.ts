import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508201601151755694876825 implements MigrationInterface {
    name = 'Mig202508201601151755694876825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" RENAME COLUMN "phonel" TO "phone"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" RENAME COLUMN "phone" TO "phonel"`);
    }

}
