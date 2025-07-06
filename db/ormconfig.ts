
import { ConnectionOptions } from 'typeorm';

import { TCardTable } from './../db/models/data/t_cards'
import { TCardStageTable } from './../db/models/data/t_card_stages'
import { TCardOperationTable } from './../db/models/data/t_card_operations'
import { TCardProductTable } from './../db/models/data/t_card_products'

import { UOMsTable } from './../db/models/catalogs/uoms';
import { ActionTable } from './../db/models/catalogs/actions'
import { TeamTable } from './../db/models/catalogs/teams'
import { UserTable } from './../db/models/catalogs/users'
import { UnitTable } from './../db/models/catalogs/units'
import { UserUnitTable } from './../db/models/catalogs/user_unit'
import { UnitActionTable } from './../db/models/catalogs/unit_actions'
import { AgreementTable } from './../db/models/catalogs/agreements'
import { UserAgreeTable } from './../db/models/catalogs/user_agree'
import { TemplateTable } from './../db/models/catalogs/templates'

import { TeamScheduleTable } from './../db/models/plan/team_schedule'
import { UnitExceptionTable } from './../db/models/plan/unit_exceptions'
import { UnitLoadTable } from './../db/models/plan/unit_loads'
import { SettingsTable } from './../db/models/plan/settings'

import { SupportTable } from './../db/models/support/support'
import { BillTable } from './../db/models/support/bills'

const host = String(process.env.NEXT_PUBLIC_DB_HOST);
const username = String(process.env.NEXT_PUBLIC_DB_USERNAME);
const password = String(process.env.NEXT_PUBLIC_DB_PASSWORD);
const database = String(process.env.NEXT_PUBLIC_DB_DATABASE);

const config: ConnectionOptions = {
  type: 'postgres',
  host: host, // localhost
  port: 25060,
  username: username,
  password: password, // замените на ваш пароль
  database: database, // замените на имя вашей базы данных
  // synchronize: true, // Включить синхронизацию схемы (не рекомендуется для продакшн-среды)
  // logging: true, // Включите логирование SQL-запросов (можно отключить в продакшн-среде)
  logging: ["error", "warn"],

  entities: 
     [
      TCardTable, TCardOperationTable, TCardProductTable, TCardStageTable,
      UOMsTable, ActionTable, TeamTable, UnitTable, UserTable, UnitActionTable,
      TeamScheduleTable, UnitExceptionTable, UnitLoadTable, SettingsTable,
      AgreementTable, UserAgreeTable, UserUnitTable, TemplateTable,
      SupportTable, BillTable
    ]
    ,
  
  migrations: ["/db/migrations/**/*.ts"],  // Путь к миграциям
  subscribers: [],
  ssl: {
    rejectUnauthorized: false,
  },
};


export default config;
