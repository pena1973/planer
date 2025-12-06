import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509111640001757598001956 implements MigrationInterface {
    name = 'Mig202509111640001757598001956'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" ADD "customerId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "customerId"`);
    }

}
