import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508221421571755861719629 implements MigrationInterface {
    name = 'Mig202508221421571755861719629'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "active_time" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "direction" character varying NOT NULL, "date" character varying NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "PK_07bbf363ed23e40bcd42f006ca3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "active_time"`);
    }

}
