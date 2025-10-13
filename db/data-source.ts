
// db/data-source.ts
import 'reflect-metadata';

import { DataSource } from 'typeorm';
import config from './ormconfig';
import { getEntities } from './entities';

export const AppDataSource = new DataSource({
  ...config,
  entities: getEntities(), // важно: подставляем актуальный список
  migrations: [
    __dirname + '/migrations/**/*.ts',
    __dirname + '/migrations/**/*.js',
  ],
});


