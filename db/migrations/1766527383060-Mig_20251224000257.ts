import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512240002571766527383060 implements MigrationInterface {
    name = 'Mig202512240002571766527383060'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" RENAME COLUMN "summa" TO "amount"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balance" RENAME COLUMN "amount" TO "summa"`);
    }

}
