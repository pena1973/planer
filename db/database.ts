// import config from './ormconfig';

import { DataSource } from 'typeorm';
import config from './ormconfig';
import { getEntities } from '../lib/db/entities'; // Твоя обёртка

let dataSource: DataSource | null = null;

const connectDb = async (): Promise<DataSource> => {
  try {
    if (dataSource && dataSource.isInitialized) return dataSource;

    console.log('Initializing new DataSource...');

    // Вставляем список сущностей прямо в конфиг
    const updatedConfig = {
      ...config,
      entities: getEntities(),
    };
    console.log('🟡 Инициализация базы начинается');

    // console.log('getEntities()',getEntities());

    dataSource = new DataSource(updatedConfig);

    await dataSource.initialize()
      .then(() => console.log('🟢 DataSource инициализирован'))
      .catch((err) => console.error('🔴 Ошибка инициализации', err));

    // console.log('Сущности в DataSource:', updatedConfig.entities);

    // console.log(
    //   'Зарегистрированные сущности:',
    //   dataSource.entityMetadatas.map(e => e.name)
    // );

    console.log('DataSource initialized successfully');
    return dataSource;
  } catch (error) {
    console.error('Ошибка инициализации DataSource:', error);
    throw error;
  }
};

export default connectDb;
