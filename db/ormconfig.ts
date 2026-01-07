
// db/ormconfig.ts

import { DataSourceOptions } from 'typeorm';
import { getEntities } from './entities';

/** Бросаем понятную ошибку, если переменная не задана */
const must = (name: string): string => {
  const v = process.env[name];
  if (!v) {
    throw new Error(`[ormconfig] Missing required env var: ${name}`);
  }
  return v;
};

// Если задана DATABASE_URL — используем её, иначе читаем по полям
const base: DataSourceOptions = process.env.DATABASE_URL
  ? {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }
  : {
    type: 'postgres',
    host: must('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 5432),
    username: must('DB_USERNAME'),
    password: must('DB_PASSWORD'),
    database: must('DB_DATABASE'),
    ssl: { rejectUnauthorized: false },
  };

const config: DataSourceOptions = {
  ...base,
  
  logging: ['error', 'warn'],

  entities: getEntities(),                         // явный список классов
  // migrations: [__dirname + '/migrations/**/*.ts'], // ts в dev (в prod переопределим на .js в data-source.ts)
  migrations: [
    __dirname + '/migrations/**/*.ts',
    __dirname + '/migrations/**/*.js',
  ],
  subscribers: [],
  synchronize: false,
  migrationsRun: false,
};

export default config;
