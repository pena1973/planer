import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512172323031766006584953 implements MigrationInterface {
    name = 'Mig202512172323031766006584953'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" ADD "country" character(2) NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "country"`);
    }

}
