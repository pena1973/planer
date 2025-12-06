import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509122313201757708006256 implements MigrationInterface {
    name = 'Mig202509122313201757708006256'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "job-settings" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "job_key" character varying NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "timezone" character varying NOT NULL DEFAULT 'Europe/Riga', "schedule_type" character varying NOT NULL, "monthly_day" integer, "monthly_end_of_month" boolean NOT NULL DEFAULT false, "daily_time" character varying, "hourly_minute" integer, "every_minutes" integer, "next_run_at" TIMESTAMP WITH TIME ZONE, "last_run_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_961b053b6dedb269c666f104702" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_21990b7c244d48998802772358" ON "job-settings" ("job_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_d7f1b211da4f628641dfb7c802" ON "job-settings" ("next_run_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d7f1b211da4f628641dfb7c802"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21990b7c244d48998802772358"`);
        await queryRunner.query(`DROP TABLE "job-settings"`);
    }

}
