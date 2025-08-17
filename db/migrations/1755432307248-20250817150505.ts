import { MigrationInterface, QueryRunner } from "typeorm";

export class BanersInit202508171505051755432307248 implements MigrationInterface {
    name = '202508171505051755432307248'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "baners" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "dateFrom" date NOT NULL, "dateTo" date NOT NULL, "locale" character varying NOT NULL DEFAULT '', "message" text NOT NULL, "active" boolean NOT NULL DEFAULT false, "team_id" integer NOT NULL, CONSTRAINT "PK_0674907fe9902485102a14df09c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "baners"`);
    }

}
