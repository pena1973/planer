
import { ConnectionOptions } from 'typeorm';

import { TCardTable} from '@/pages/db/models/data/t_cards'
import { TCardStageTable} from '@/pages/db/models/data/t_card_stages'
import { TCardOperationTable} from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable} from '@/pages/db/models/data/t_card_products'

import { UOMsTable } from '@/pages/db/models/catalogs/uoms';
import { ActionTable} from '@/pages/db/models/catalogs/actions'
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UserTable } from '@/pages/db/models/catalogs/users'
import { UnitTable } from '@/pages/db/models/catalogs/units'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { CompanyScheduleTable } from '@/pages/db/models/plan/company-schedule'
import { UnitExceptionTable } from '@/pages/db/models/plan/unit-exceptions'
import { UnitLoadTable } from '@/pages/db/models/plan/unit-loads'
import { SettingsTable} from '@/pages/db/models/plan/settings'

import { TypeEnum } from '@/pages/db/models/enums';

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
  synchronize: true, // Включить синхронизацию схемы (не рекомендуется для продакшн-среды)
  logging: true, // Включите логирование SQL-запросов (можно отключить в продакшн-среде)
  entities: [TCardTable, TCardOperationTable,TCardProductTable,TCardStageTable,
    UOMsTable,ActionTable,UnitTable,UserTable,CompanyTable,UnitActionTable,
    CompanyScheduleTable,UnitExceptionTable,UnitLoadTable,SettingsTable
  ],
  migrations: ["/pages/db/migrations/**/*.ts"],  // Путь к миграциям
  subscribers: [],
  ssl: {
    rejectUnauthorized: false,
  },
};


export default config;
