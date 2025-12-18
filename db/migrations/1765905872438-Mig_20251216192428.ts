// import { MigrationInterface, QueryRunner } from "typeorm";

// export class Mig202512161924281765905872438 implements MigrationInterface {
//     name = 'Mig202512161924281765905872438'

//     public async up(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`CREATE UNIQUE INDEX "ux_balance_team_transaction" ON "balance" ("team_id", "transaction_id") `);
//     }

//     public async down(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`DROP INDEX "public"."ux_balance_team_transaction"`);
//     }

// }


import { MigrationInterface, QueryRunner } from "typeorm";

export class Mig202512161924281765905872438 implements MigrationInterface {
  name = "Mig202512161924281765905872438";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "ux_balance_team_transaction" ON "balance" ("team_id", "transaction_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."ux_balance_team_transaction"`
    );
  }
}
