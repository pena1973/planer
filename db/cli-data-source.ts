
// db/cli-data-source   ТОЛЬКО ДЛЯ МИГРАЦИЙ
import 'reflect-metadata';

// 1) СНАЧАЛА подгружаем env
import { config as loadEnv } from 'dotenv';
import path from 'path';
loadEnv({ path: path.resolve(process.cwd(), '.env') });
loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { DataSource } from 'typeorm';
import config from './ormconfig';
import { getEntities } from './entities';

// Если запускаешь через ts-node — будет TS, иначе JS (для dist)
// const isTsRuntime = !!process.env.TS_NODE;
const isTsRuntime = __filename.endsWith('.ts') || !!process.env.TS_NODE;
// const migrations = isTsRuntime
//   ? [path.join(__dirname, 'migrations', '**', '*.ts')]
//   : [path.join(__dirname, 'migrations', '**', '*.js')];
const migrations = isTsRuntime
  ? [path.join(__dirname, 'migrations', '*.ts')]
  : [path.join(__dirname, 'migrations', '*.js')];

const AppDataSource = new DataSource({
  ...config,
  entities: getEntities(), // важно: подставляем актуальный список
 migrations,
});


export default AppDataSource;
