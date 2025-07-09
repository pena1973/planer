// import config from './ormconfig';

import { DataSource } from 'typeorm';
import config from './ormconfig';
import { getEntities } from '../lib/db/entities';

// let dataSource: DataSource | null = null;

// let dataSource = globalThis.dataSource;

const connectDb = async (): Promise<DataSource> => {
  try {
    // console.log('isInitialized', globalThis.dataSource);

    if (globalThis.dataSource && globalThis.dataSource.isInitialized) return globalThis.dataSource;

    console.log('Initializing new DataSource...');
    console.log('📦 Сущности при инициализации:', getEntities().map(e => e.name));
    // Вставляем список сущностей прямо в конфиг
    const updatedConfig = {
      ...config,
      entities: getEntities(),
    };
    console.log('🟡 Инициализация базы начинается');

    // console.log('getEntities()', getEntities());

    globalThis.dataSource = new DataSource(updatedConfig);

    await globalThis.dataSource.initialize()
      .then(() => console.log('🟢 DataSource инициализирован'))
      .catch((err) => console.error('🔴 Ошибка инициализации', err));

    // console.log('Сущности в DataSource:', updatedConfig.entities);

    // console.log(
    //   'Зарегистрированные сущности:',
    //   globalThis.dataSource.entityMetadatas.map(e => e.name)
    // );
    console.log('📋 Метаданные сущностей:');
    globalThis.dataSource.entityMetadatas.forEach(meta => {
      console.log(`- ${meta.name} →`, meta.target);
    });

    console.log('DataSource initialized successfully');
    return globalThis.dataSource;
  } catch (error) {
    console.error('Ошибка инициализации DataSource:', error);
    globalThis.dataSource = undefined;
    throw error;
  }
};

export default connectDb;
