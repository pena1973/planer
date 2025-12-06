import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202508311854401756655681850 implements MigrationInterface {
    name = 'Mig202508311854401756655681850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "verification_codes" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "purpose" character varying(32) NOT NULL, "code_hash" character varying(400) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "max_attempts" integer NOT NULL DEFAULT '6', "used" boolean NOT NULL DEFAULT false, "request_ip" character varying(64), "meta" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_18741b6b8bf1680dbf5057421d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3b71b1fccadf73dc8d32517396" ON "verification_codes" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_6e99c15189b38037eb4dc8756d" ON "verification_codes" ("purpose") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6e99c15189b38037eb4dc8756d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b71b1fccadf73dc8d32517396"`);
        await queryRunner.query(`DROP TABLE "verification_codes"`);
    }

}
