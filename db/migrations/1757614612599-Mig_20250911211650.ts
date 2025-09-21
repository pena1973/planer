import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509112116501757614612599 implements MigrationInterface {
    name = 'Mig202509112116501757614612599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "adress"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "person"`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "postal_code" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "address_line1" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "address_line2" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "city" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "title" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "reg_n" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "email" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "phone" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "country" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "country" SET DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "country" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "country" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "phone" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "email" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "reg_n" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "title" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "address_line2"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "address_line1"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "postal_code"`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "person" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "adress" character varying NOT NULL`);
    }

}
