import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509111520361757593237741 implements MigrationInterface {
    name = 'Mig202509111520361757593237741'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" ADD "country" character(2) `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "country"`);
    }

}
