import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202511031613081762179189765 implements MigrationInterface {
    name = 'Mig202511031613081762179189765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "leads" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(150) NOT NULL, "email" character varying(255), "phone" character varying(50), "message" text, "status" character varying(20) NOT NULL DEFAULT 'new', "source" character varying(40) NOT NULL DEFAULT 'landing', "main_team" character varying NOT NULL DEFAULT '', CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "leads"`);
    }

}
