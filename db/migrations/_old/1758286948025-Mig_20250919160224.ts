import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202509191602241758286948025 implements MigrationInterface {
    name = 'Mig202509191602241758286948025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."units_type_enum" RENAME TO "units_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."units_type_enum" AS ENUM('process', 'control')`);
        await queryRunner.query(`ALTER TABLE "units" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "units" ALTER COLUMN "type" TYPE "public"."units_type_enum" USING "type"::"text"::"public"."units_type_enum"`);
        await queryRunner.query(`ALTER TABLE "units" ALTER COLUMN "type" SET DEFAULT 'process'`);
        await queryRunner.query(`DROP TYPE "public"."units_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."units_type_enum_old" AS ENUM('keep', 'process', 'control')`);
        await queryRunner.query(`ALTER TABLE "units" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "units" ALTER COLUMN "type" TYPE "public"."units_type_enum_old" USING "type"::"text"::"public"."units_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "units" ALTER COLUMN "type" SET DEFAULT 'process'`);
        await queryRunner.query(`DROP TYPE "public"."units_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."units_type_enum_old" RENAME TO "units_type_enum"`);
    }

}
