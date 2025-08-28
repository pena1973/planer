import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508281145481756370750507 implements MigrationInterface {
    name = 'Mig202508281145481756370750507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "vatAmount"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "totalAmount"`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "vat_amount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "total_amount" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "total_amount"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "vat_amount"`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "totalAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bills" ADD "vatAmount" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

}
