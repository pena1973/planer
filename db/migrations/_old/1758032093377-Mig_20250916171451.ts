import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509161714511758032093377 implements MigrationInterface {
    name = 'Mig202509161714511758032093377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support" ADD "processed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support" DROP COLUMN "processed"`);
    }

}
