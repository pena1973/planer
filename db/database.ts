import config from './ormconfig';

import { DataSource } from 'typeorm';

let dataSource: DataSource | null = null;

const connectDb = async (): Promise<DataSource> => {
  try {
    if (dataSource) return dataSource;  // Возвращаем уже существующее соединение

    console.log('Initializing new DataSource...');

    dataSource = new DataSource(config);  // Создаем новый источник данных

    // Инициализация соединения
    await dataSource.initialize();
    console.log('Сущности в DataSource:', dataSource.options.entities);

    console.log(
      'Зарегистрированные сущности:',
      dataSource.entityMetadatas.map(e => e.name)
    );

    console.log('DataSource initialized successfully');

    return dataSource;
  } catch (error) {
    console.error('Error during DataSource initialization:', error);

    throw error;  // Пробрасываем ошибку дальше, чтобы она была замечена
  }
};

export default connectDb;

