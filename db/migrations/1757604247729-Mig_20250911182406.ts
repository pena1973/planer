import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509111824061757604247729 implements MigrationInterface {
    name = 'Mig202509111824061757604247729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" RENAME COLUMN "customerId" TO "customer_id"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "customer_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "customer_id" SET DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "customer_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "customer_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clients" RENAME COLUMN "customer_id" TO "customerId"`);
    }

}
