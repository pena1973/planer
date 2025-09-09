import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508231820541755962456289 implements MigrationInterface {
    name = 'Mig202508231820541755962456289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "main" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "reg_n" character varying NOT NULL, "adress" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "person" character varying NOT NULL, "price" numeric(12,2) NOT NULL DEFAULT '0', "discount" smallint NOT NULL DEFAULT '0', CONSTRAINT "PK_341b4b71622db87796913ed280d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "main"`);
    }

}
