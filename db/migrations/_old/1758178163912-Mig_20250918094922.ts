import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509180949221758178163912 implements MigrationInterface {
    name = 'Mig202509180949221758178163912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."mails_status_enum" AS ENUM('draft', 'prepared', 'planed', 'performed', 'ready', 'defective', 'cancelled', 'closed')`);
        await queryRunner.query(`CREATE TABLE "mails" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "date" date NOT NULL, "title" character varying NOT NULL DEFAULT '', "body" text NOT NULL, "fromUser" boolean NOT NULL DEFAULT false, "basedOn" integer, "team_id" integer NOT NULL, "user_id" integer NOT NULL, "processed" boolean NOT NULL DEFAULT false, "status" "public"."mails_status_enum" NOT NULL DEFAULT 'prepared', CONSTRAINT "PK_218248d7dfe1b739f06e2309349" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "mails"`);
        await queryRunner.query(`DROP TYPE "public"."mails_status_enum"`);
    }

}
