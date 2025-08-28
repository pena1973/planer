import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508272015251756314927399 implements MigrationInterface {
    name = 'Mig202508272015251756314927399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" ADD "amount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "vatAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "totalAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "vat" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "vat"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "totalAmount"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "vatAmount"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "amount"`);
    }

}
