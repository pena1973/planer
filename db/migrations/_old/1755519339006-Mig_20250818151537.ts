import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508181515371755519339006 implements MigrationInterface {
    name = 'Mig202508181515371755519339006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "t_card_operations" ADD "team_id" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "t_card_products" ADD "team_id" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "t_card_stages" ADD "team_id" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "team_id" integer NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "team_id"`);
        await queryRunner.query(`ALTER TABLE "t_card_stages" DROP COLUMN "team_id"`);
        await queryRunner.query(`ALTER TABLE "t_card_products" DROP COLUMN "team_id"`);
        await queryRunner.query(`ALTER TABLE "t_card_operations" DROP COLUMN "team_id"`);
    }

}
