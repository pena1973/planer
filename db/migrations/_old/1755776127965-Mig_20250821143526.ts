import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508211435261755776127965 implements MigrationInterface {
    name = 'Mig202508211435261755776127965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "balance" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "date" date NOT NULL, "summa" character varying NOT NULL DEFAULT '0', "direction" character varying NOT NULL DEFAULT '', "document" character varying NOT NULL DEFAULT '', "coment" character varying NOT NULL DEFAULT '', "is_trial" boolean NOT NULL DEFAULT false, "team_id" integer NOT NULL, CONSTRAINT "PK_079dddd31a81672e8143a649ca0" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "balance"`);
    }

}
