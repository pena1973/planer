import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509241129431758702588610 implements MigrationInterface {
    name = 'Mig202509241129431758702588610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system_logs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "level" character varying(50) NOT NULL, "origin" character varying(20) NOT NULL, "user_id" integer, "event" character varying(120) NOT NULL, "location" character varying(120) NOT NULL, "message" text NOT NULL, "context" jsonb, CONSTRAINT "PK_56861c4b9d16aa90259f4ce0a2c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_logs_created_at" ON "system_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_logs_level" ON "system_logs" ("level") `);
        await queryRunner.query(`CREATE INDEX "idx_logs_origin" ON "system_logs" ("origin") `);
        await queryRunner.query(`CREATE INDEX "idx_logs_user_id" ON "system_logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_logs_event" ON "system_logs" ("event") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_logs_event"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_origin"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_level"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_created_at"`);
        await queryRunner.query(`DROP TABLE "system_logs"`);
    }

}
