
// import { DataSourceOptions } from 'typeorm';
// import { getEntities } from './entities'; // путь без алиаса

// const config: DataSourceOptions = {
//   type: 'postgres',
//   host: String(process.env.NEXT_PUBLIC_DB_HOST),
//   port: 25060,
//   username: String(process.env.NEXT_PUBLIC_DB_USERNAME),
//   password: String(process.env.NEXT_PUBLIC_DB_PASSWORD),
//   database: String(process.env.NEXT_PUBLIC_DB_DATABASE),
//   logging: ['error', 'warn'],
//   entities: getEntities(), // ключевая строка — теперь динамически
//   migrations: ['/db/migrations/**/*.ts'],
//   subscribers: [],
//   ssl: { rejectUnauthorized: false },
//   synchronize:false, // отключение автосинхронизации моделей (Не рекомендуется в продакшене, но можно использовать в dev-режиме)
//   migrationsRun: false, // автоматически запускать миграции при старте приложения - не рекомендуется в продакшене
// };

// export default config;


// // db/ormconfig.ts
// import { DataSourceOptions } from 'typeorm';
// import { getEntities } from './entities';

// const config: DataSourceOptions = {
//   type: 'postgres',
//   host: String(process.env.DB_HOST),          
//   port: Number(process.env.DB_PORT ?? 5432),
//   username: String(process.env.DB_USERNAME),
//   password: String(process.env.DB_PASSWORD),
//   database: String(process.env.DB_DATABASE),
//   logging: ['error', 'warn'],
//   entities: getEntities(),
//   migrations: [__dirname + '/migrations/**/*.ts'], // <— относительный путь
//   subscribers: [],
//   ssl: { rejectUnauthorized: false },
//   synchronize: false,
//   migrationsRun: false,
// };

// export default config;
// db/ormconfig.ts

// db/ormconfig.ts

// import { config as loadEnv } from 'dotenv';
// import path from 'path';

// // подхватываем .env и .env.local из корня проекта
// loadEnv({ path: path.resolve(process.cwd(), '.env') });
// loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: true });


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
