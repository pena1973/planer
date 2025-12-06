import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508191451321755604294528 implements MigrationInterface {
    name = 'Mig202508191451321755604294528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bill_rows" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "bill" integer NOT NULL, "date_from" date NOT NULL, "date_to" date NOT NULL, "billable_team_id" character varying NOT NULL, "discaunt" character varying NOT NULL, "amount" character varying NOT NULL, "carency" character varying NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "PK_1b084d7b59c97de1186f0341831" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "reg_n" character varying NOT NULL, "adress" character varying NOT NULL, "email" character varying NOT NULL, "phonel" character varying NOT NULL, "person" character varying NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TABLE "bill_rows"`);
    }

}
