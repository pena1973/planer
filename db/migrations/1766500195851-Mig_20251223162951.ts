import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512231629511766500195851 implements MigrationInterface {
    name = 'Mig202512231629511766500195851'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" ADD "is_gift" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" DROP COLUMN "is_gift"`);
    }

}
