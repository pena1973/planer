import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1765050723434 implements MigrationInterface {
    name = 'InitSchema1765050723434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."t_cards_status_enum" AS ENUM('draft', 'prepared', 'planed', 'performed', 'ready', 'defective', 'cancelled', 'closed')`);
        await queryRunner.query(`CREATE TABLE "t_cards" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "date" date NOT NULL, "user_id" integer NOT NULL, "team_id" integer NOT NULL, "idc" integer NOT NULL, "max_idc" integer NOT NULL DEFAULT '0', "coment" text NOT NULL DEFAULT '', "status" "public"."t_cards_status_enum" NOT NULL DEFAULT 'draft', CONSTRAINT "PK_c14a7015cb78879f92cd29968a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."t_card_operations_status_enum" AS ENUM('draft', 'prepared', 'planed', 'performed', 'ready', 'defective', 'cancelled', 'closed')`);
        await queryRunner.query(`CREATE TABLE "t_card_operations" ("id" SERIAL NOT NULL, "idc" integer NOT NULL, "stage_id" integer NOT NULL, "order" integer NOT NULL DEFAULT '0', "action_id" integer, "duration" integer NOT NULL, "tcard_id" bigint NOT NULL, "status" "public"."t_card_operations_status_enum" NOT NULL DEFAULT 'draft', "coment" text NOT NULL DEFAULT '', "fix_oper_idc" integer NOT NULL DEFAULT '0', "team_id" integer NOT NULL, CONSTRAINT "PK_d4def5fcb9ae4fde5fc63b0a631" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."t_card_products_type_enum" AS ENUM('P', 'W', 'M', 'I', 'O', 'A')`);
        await queryRunner.query(`CREATE TABLE "t_card_products" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "code" character varying NOT NULL, "type" "public"."t_card_products_type_enum" NOT NULL DEFAULT 'M', "qtu" integer NOT NULL, "tcard_id" bigint NOT NULL, "operation_id" integer, "product_id" integer NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "PK_0c793a6af5c8de37840e187961b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "t_card_stages" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "idc" integer NOT NULL, "code" character varying NOT NULL, "tcard_id" bigint NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "PK_0410d94b30303a8962fa3f75db2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "idc" integer NOT NULL, "title" character varying NOT NULL, "sync" character varying NOT NULL, "uom_id" integer NOT NULL, "tcard_id" bigint NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "uoms" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "coment" text NOT NULL DEFAULT '', "code" character varying DEFAULT '', "team_id" integer NOT NULL, CONSTRAINT "PK_f207a792064e3032c8fe3922b22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "actions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "coment" text NOT NULL DEFAULT '', "code" character varying DEFAULT '', "interruptible" boolean NOT NULL DEFAULT true, "team_id" integer NOT NULL, CONSTRAINT "PK_7bfb822f56be449c0b8adbf83cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "teams" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "coment" text NOT NULL DEFAULT '', "prefix" character varying NOT NULL, "main_team" character varying NOT NULL DEFAULT '', CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL DEFAULT '', "login" character varying NOT NULL, "pass" character varying NOT NULL, "loginhash" character varying NOT NULL DEFAULT '', "locale" character varying NOT NULL DEFAULT 'en', "isAdmin" boolean NOT NULL DEFAULT false, "confirmed" boolean NOT NULL DEFAULT false, "coment" character varying NOT NULL DEFAULT '', "active" boolean NOT NULL DEFAULT true, "team_id" integer NOT NULL, "isSystem" boolean NOT NULL DEFAULT false, "password_changed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."units_belong_enum" AS ENUM('inner', 'outer')`);
        await queryRunner.query(`CREATE TYPE "public"."units_type_enum" AS ENUM('process', 'control')`);
        await queryRunner.query(`CREATE TABLE "units" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "idc" bigint NOT NULL, "title" character varying NOT NULL, "code" character varying, "retool" integer NOT NULL DEFAULT '0', "coment" text DEFAULT '', "belong" "public"."units_belong_enum" NOT NULL DEFAULT 'inner', "type" "public"."units_type_enum" NOT NULL DEFAULT 'process', "active" boolean NOT NULL DEFAULT false, "team_id" integer NOT NULL, CONSTRAINT "UQ_ac7559eff6c77753054082a5602" UNIQUE ("idc"), CONSTRAINT "PK_5a8f2f064919b587d93936cb223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "unit_actions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "idc" bigint NOT NULL, "koef" numeric(10,2) NOT NULL DEFAULT '1', "coment" character varying NOT NULL DEFAULT '', "action_id" integer NOT NULL, "unit_id" integer NOT NULL, "unit_idc" bigint NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "UQ_d19cfde1bebfba45c8b96ab86f4" UNIQUE ("idc"), CONSTRAINT "PK_4ec51c7a41c46c4dec7bbec127f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "agreements" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "date" date NOT NULL, "text" text NOT NULL DEFAULT '', "locale" character varying NOT NULL DEFAULT 'en', CONSTRAINT "PK_01532f6c999d44c776e3d1fa4c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_agree" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "signed" boolean NOT NULL DEFAULT false, "date" date, "user_id" integer NOT NULL, "agreement_id" integer NOT NULL, CONSTRAINT "PK_0a2f77e1945306bfa26778841dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users_units" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "team_id" integer NOT NULL, "unit_id" integer, "active" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6ef629e302a85fe77756cbb0822" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "templates" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL DEFAULT '', "fileContent" text NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "team_schedule" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "timeStartWork" integer NOT NULL, "timeFinishWork" integer NOT NULL, "breaks" text, "holidays" date array, "weekends" text, "workdays" json, "team_id" integer NOT NULL, "timeZone" character varying(255) NOT NULL DEFAULT '', CONSTRAINT "UQ_841fa234070047e07585fc87357" UNIQUE ("team_id"), CONSTRAINT "PK_9d36326762f4ad471c8c3c03291" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."unit_exceptions_type_enum" AS ENUM('work', 'not work', 'breack', 'busy', 'retool')`);
        await queryRunner.query(`CREATE TABLE "unit_exceptions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "idc" bigint NOT NULL, "date" date NOT NULL, "type" "public"."unit_exceptions_type_enum" NOT NULL, "timeStart" integer NOT NULL, "timeFinish" integer NOT NULL, "team_id" integer NOT NULL, "unit_id" integer NOT NULL, "unit_idc" bigint NOT NULL, CONSTRAINT "UQ_346cc1a7091e56f83ef2d027eab" UNIQUE ("idc"), CONSTRAINT "PK_94c186fd31172b1a83dd40b94d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."unit_loads_status_enum" AS ENUM('draft', 'prepared', 'planed', 'performed', 'ready', 'defective', 'cancelled', 'closed')`);
        await queryRunner.query(`CREATE TABLE "unit_loads" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "idc" bigint NOT NULL, "date" date NOT NULL, "id_oper" integer NOT NULL, "idc_oper" integer NOT NULL, "id_tCard" bigint NOT NULL, "timeStart" bigint NOT NULL, "timeFinish" bigint NOT NULL, "team_id" integer NOT NULL, "unit_id" integer NOT NULL, "status" "public"."unit_loads_status_enum" NOT NULL DEFAULT 'planed', "version" bigint, "isActive" boolean NOT NULL DEFAULT true, "isRetool" boolean NOT NULL DEFAULT false, "isPinned" boolean NOT NULL DEFAULT false, "isOuterStart" boolean NOT NULL DEFAULT false, "isOuterFinish" boolean NOT NULL DEFAULT false, "isFirst" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_3c658478ba3b056295f7e930fb6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "settings" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "timeStartWork" integer NOT NULL, "timeFinishWork" integer NOT NULL, "showWeekend" boolean NOT NULL DEFAULT true, "showHoliday" boolean NOT NULL DEFAULT true, "isQualControl" boolean NOT NULL DEFAULT false, "team_id" integer NOT NULL, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."mails_status_enum" AS ENUM('draft', 'prepared', 'planed', 'performed', 'ready', 'defective', 'cancelled', 'closed')`);
        await queryRunner.query(`CREATE TABLE "mails" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "date" date NOT NULL, "title" character varying NOT NULL DEFAULT '', "body" text NOT NULL, "fromUser" boolean NOT NULL DEFAULT false, "basedOn" integer, "team_id" integer NOT NULL, "user_id" integer NOT NULL, "processed" boolean NOT NULL DEFAULT false, "status" "public"."mails_status_enum" NOT NULL DEFAULT 'prepared', CONSTRAINT "PK_218248d7dfe1b739f06e2309349" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "job-settings" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "job_key" character varying NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "timezone" character varying NOT NULL DEFAULT 'Europe/Riga', "schedule_type" character varying NOT NULL, "monthly_day" integer, "monthly_end_of_month" boolean NOT NULL DEFAULT false, "daily_time" character varying, "hourly_minute" integer, "every_minutes" integer, "next_run_at" TIMESTAMP WITH TIME ZONE, "last_run_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_961b053b6dedb269c666f104702" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_21990b7c244d48998802772358" ON "job-settings" ("job_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_d7f1b211da4f628641dfb7c802" ON "job-settings" ("next_run_at") `);
        await queryRunner.query(`CREATE TABLE "clients" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL DEFAULT '', "reg_n" character varying NOT NULL DEFAULT '', "postal_code" character varying NOT NULL DEFAULT '', "address_line1" character varying NOT NULL DEFAULT '', "address_line2" character varying NOT NULL DEFAULT '', "city" character varying NOT NULL DEFAULT '', "email" character varying NOT NULL DEFAULT '', "phone" character varying NOT NULL DEFAULT '', "team_id" integer NOT NULL, "country" character(2) NOT NULL DEFAULT '', "customer_id" character varying NOT NULL DEFAULT '', CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "baners" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "date_from" date NOT NULL, "date_to" date NOT NULL, "locale" character varying NOT NULL DEFAULT '', "message" text NOT NULL, "active" boolean NOT NULL DEFAULT false, "team_id" integer, "user_id" integer, CONSTRAINT "PK_0674907fe9902485102a14df09c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "balance" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "date" character varying NOT NULL DEFAULT '', "summa" numeric(12,2) NOT NULL DEFAULT '0', "direction" character varying NOT NULL DEFAULT '', "document" character varying NOT NULL DEFAULT '', "coment" character varying NOT NULL DEFAULT '', "is_trial" boolean NOT NULL DEFAULT false, "team_id" integer NOT NULL, "transaction_id" character varying NOT NULL DEFAULT '', CONSTRAINT "PK_079dddd31a81672e8143a649ca0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "active_time" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "direction" character varying NOT NULL, "date" character varying NOT NULL, "team_id" integer NOT NULL, CONSTRAINT "PK_07bbf363ed23e40bcd42f006ca3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "main" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "reg_n" character varying NOT NULL, "adress" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "person" character varying NOT NULL, "price" numeric(12,2) NOT NULL DEFAULT '0', "discount" smallint NOT NULL DEFAULT '0', "from" character varying NOT NULL DEFAULT '', "VAT" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_341b4b71622db87796913ed280d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "verification_codes" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "purpose" character varying(32) NOT NULL, "code_hash" character varying(400) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "max_attempts" integer NOT NULL DEFAULT '6', "used" boolean NOT NULL DEFAULT false, "request_ip" character varying(64), "meta" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_18741b6b8bf1680dbf5057421d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3b71b1fccadf73dc8d32517396" ON "verification_codes" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_6e99c15189b38037eb4dc8756d" ON "verification_codes" ("purpose") `);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" SERIAL NOT NULL, "stripe_invoice_id" character varying(64) NOT NULL, "stripe_invoice_number" character varying(64), "stripe_customer_id" character varying(64), "team_id" integer NOT NULL, "status" character varying(16) NOT NULL DEFAULT 'paid', "currency" character(3) NOT NULL, "amount_subtotal" bigint NOT NULL, "tax_amount" bigint NOT NULL, "amount_total" bigint NOT NULL, "hosted_invoice_url" text, "invoice_pdf_url" text, "customer_email" character varying(255), "customer_country" character(2), "customer_vat_id" character varying(64), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "paid_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0ddf8494c8665a57c670287ccd" ON "invoices" ("stripe_invoice_id") `);
        await queryRunner.query(`CREATE TABLE "system_logs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "level" character varying(50) NOT NULL, "origin" character varying(20) NOT NULL, "user_id" integer, "event" character varying(120) NOT NULL, "location" character varying(120) NOT NULL, "message" text NOT NULL, "context" jsonb, CONSTRAINT "PK_56861c4b9d16aa90259f4ce0a2c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_logs_created_at" ON "system_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_logs_level" ON "system_logs" ("level") `);
        await queryRunner.query(`CREATE INDEX "idx_logs_origin" ON "system_logs" ("origin") `);
        await queryRunner.query(`CREATE INDEX "idx_logs_user_id" ON "system_logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_logs_event" ON "system_logs" ("event") `);
        await queryRunner.query(`CREATE TABLE "leads" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(150) NOT NULL, "company" character varying(250) NOT NULL DEFAULT '', "email" character varying(255) NOT NULL DEFAULT '', "phone" character varying(50) NOT NULL DEFAULT '', "time" character varying(150) NOT NULL DEFAULT '', "message" text NOT NULL DEFAULT '', "notes" text NOT NULL DEFAULT '', "status" character varying(20) NOT NULL DEFAULT 'new', "source" character varying(40) NOT NULL DEFAULT 'landing', "locale" character varying NOT NULL DEFAULT 'en', "agree" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "leads"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_event"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_origin"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_level"`);
        await queryRunner.query(`DROP INDEX "public"."idx_logs_created_at"`);
        await queryRunner.query(`DROP TABLE "system_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ddf8494c8665a57c670287ccd"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e99c15189b38037eb4dc8756d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b71b1fccadf73dc8d32517396"`);
        await queryRunner.query(`DROP TABLE "verification_codes"`);
        await queryRunner.query(`DROP TABLE "main"`);
        await queryRunner.query(`DROP TABLE "active_time"`);
        await queryRunner.query(`DROP TABLE "balance"`);
        await queryRunner.query(`DROP TABLE "baners"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7f1b211da4f628641dfb7c802"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21990b7c244d48998802772358"`);
        await queryRunner.query(`DROP TABLE "job-settings"`);
        await queryRunner.query(`DROP TABLE "mails"`);
        await queryRunner.query(`DROP TYPE "public"."mails_status_enum"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TABLE "unit_loads"`);
        await queryRunner.query(`DROP TYPE "public"."unit_loads_status_enum"`);
        await queryRunner.query(`DROP TABLE "unit_exceptions"`);
        await queryRunner.query(`DROP TYPE "public"."unit_exceptions_type_enum"`);
        await queryRunner.query(`DROP TABLE "team_schedule"`);
        await queryRunner.query(`DROP TABLE "templates"`);
        await queryRunner.query(`DROP TABLE "users_units"`);
        await queryRunner.query(`DROP TABLE "user_agree"`);
        await queryRunner.query(`DROP TABLE "agreements"`);
        await queryRunner.query(`DROP TABLE "unit_actions"`);
        await queryRunner.query(`DROP TABLE "units"`);
        await queryRunner.query(`DROP TYPE "public"."units_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."units_belong_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "teams"`);
        await queryRunner.query(`DROP TABLE "actions"`);
        await queryRunner.query(`DROP TABLE "uoms"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "t_card_stages"`);
        await queryRunner.query(`DROP TABLE "t_card_products"`);
        await queryRunner.query(`DROP TYPE "public"."t_card_products_type_enum"`);
        await queryRunner.query(`DROP TABLE "t_card_operations"`);
        await queryRunner.query(`DROP TYPE "public"."t_card_operations_status_enum"`);
        await queryRunner.query(`DROP TABLE "t_cards"`);
        await queryRunner.query(`DROP TYPE "public"."t_cards_status_enum"`);
    }

}
