import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508211356371755773798733 implements MigrationInterface {
    name = 'Mig202508211356371755773798733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "balans" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "date" date NOT NULL, "direction" character varying NOT NULL DEFAULT '', "document" character varying NOT NULL DEFAULT '', "coment" character varying NOT NULL DEFAULT '', "isTrial" boolean NOT NULL DEFAULT false, "team_id" integer NOT NULL, CONSTRAINT "PK_72d2149c8cc9614e74f022a8f6f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "balans"`);
    }

}
