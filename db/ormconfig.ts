
import { DataSourceOptions } from 'typeorm';
import { getEntities } from './entities'; // путь без алиаса

const config: DataSourceOptions = {
  type: 'postgres',
  host: String(process.env.NEXT_PUBLIC_DB_HOST),
  port: 25060,
  username: String(process.env.NEXT_PUBLIC_DB_USERNAME),
  password: String(process.env.NEXT_PUBLIC_DB_PASSWORD),
  database: String(process.env.NEXT_PUBLIC_DB_DATABASE),
  logging: ['error', 'warn'],
  entities: getEntities(), // ключевая строка — теперь динамически
  migrations: ['/db/migrations/**/*.ts'],
  subscribers: [],
  ssl: { rejectUnauthorized: false },
  synchronize:false, // отключение автосинхронизации моделей (Не рекомендуется в продакшене, но можно использовать в dev-режиме)
  migrationsRun: false, // автоматически запускать миграции при старте приложения - не рекомендуется в продакшене
};

export default config;