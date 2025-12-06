import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202510161754291760626473586 implements MigrationInterface {
    name = 'Mig202510161754291760626473586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "t_card_operations" ALTER COLUMN "action_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "team_schedule" ADD CONSTRAINT "UQ_841fa234070047e07585fc87357" UNIQUE ("team_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "team_schedule" DROP CONSTRAINT "UQ_841fa234070047e07585fc87357"`);
        await queryRunner.query(`ALTER TABLE "t_card_operations" ALTER COLUMN "action_id" SET NOT NULL`);
    }

}
