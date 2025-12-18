import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512172254071766004849586 implements MigrationInterface {
    name = 'Mig202512172254071766004849586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "adress"`);
        await queryRunner.query(`ALTER TABLE "main" ADD "postal_code" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "main" ADD "address_line1" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "main" ADD "address_line2" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "main" ADD "city" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "address_line2"`);
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "address_line1"`);
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "postal_code"`);
        await queryRunner.query(`ALTER TABLE "main" ADD "adress" character varying NOT NULL`);
    }

}
