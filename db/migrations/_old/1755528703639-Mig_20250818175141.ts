import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508181751411755528703639 implements MigrationInterface {
    name = 'Mig202508181751411755528703639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "t_card_operations" ALTER COLUMN "team_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "t_card_products" ALTER COLUMN "team_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "t_card_stages" ALTER COLUMN "team_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "team_id" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "team_id" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "t_card_stages" ALTER COLUMN "team_id" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "t_card_products" ALTER COLUMN "team_id" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "t_card_operations" ALTER COLUMN "team_id" SET DEFAULT '1'`);
    }

}
