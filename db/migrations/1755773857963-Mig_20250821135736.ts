import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508211357361755773857963 implements MigrationInterface {
    name = 'Mig202508211357361755773857963'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balans" RENAME COLUMN "isTrial" TO "is_trial"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balans" RENAME COLUMN "is_trial" TO "isTrial"`);
    }

}
