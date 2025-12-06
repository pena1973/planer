import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508231839571755963599562 implements MigrationInterface {
    name = 'Mig202508231839571755963599562'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" ADD "from" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "from"`);
    }

}
