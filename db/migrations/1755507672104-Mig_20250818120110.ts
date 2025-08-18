import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508181201101755507672104 implements MigrationInterface {
    name = 'Mig202508181201101755507672104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "baners" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "baners" ALTER COLUMN "team_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "baners" ALTER COLUMN "team_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "baners" DROP COLUMN "user_id"`);
    }

}
