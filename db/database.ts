import config from './ormconfig';

import { DataSource } from 'typeorm';
// export default config;
let dataSource: DataSource | null = null;

const connectDb = async (): Promise<DataSource> => {
  try {
    if (dataSource) return dataSource;  // Возвращаем уже существующее соединение

    console.log('Initializing new DataSource...');
   
    dataSource = new DataSource(config);  // Создаем новый источник данных

    // Инициализация соединения
    await dataSource.initialize();
    console.log('DataSource initialized successfully');
    
    return dataSource;
  } catch (error) {
    console.error('Error during DataSource initialization:', error);
    
    throw error;  // Пробрасываем ошибку дальше, чтобы она была замечена
  }
};

export default connectDb;

