// db/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from './ormconfig';
import { getEntities } from './entities';

// 👇 прогружаем env для CLI
import { config as loadEnv } from 'dotenv';
import path from 'path';
loadEnv({ path: path.resolve(process.cwd(), '.env') });
loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: true });

// const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  ...config,
  entities: getEntities(), // важно: подставляем актуальный список

// Кроссплатформенно и без зависания от NODE_ENV:
  migrations: [
    path.join(__dirname, 'migrations/**/*.ts'),
    path.join(__dirname, 'migrations/**/*.js'),
  ],
});


