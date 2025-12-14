
// db/database.ts
// import { DataSource } from 'typeorm';
// import config from './ormconfig';
// import { getEntities } from './entities';

// const connectDb = async (): Promise<DataSource> => {
//   try {
//     //  console.log('isInitialized', globalThis.dataSource);

//     if (globalThis.dataSource && globalThis.dataSource.isInitialized) return globalThis.dataSource;

//     console.log('Initializing new DataSource...');
//     console.log('📦 Сущности при инициализации:', getEntities().map(e => e.name));
//     // Вставляем список сущностей прямо в конфиг
//     const updatedConfig = {
//       ...config,
//       entities: getEntities(),
//     };
//     console.log('🟡 Инициализация базы начинается');

//      console.log('getEntities()', getEntities());

//     globalThis.dataSource = new DataSource(updatedConfig);

//     await globalThis.dataSource.initialize()
//       .then(() => console.log('🟢 DataSource инициализирован'))
//       .catch((err) => console.error('🔴 Ошибка инициализации', err));
       
    
//       console.log('Сущности в DataSource:', updatedConfig.entities);

//     //  console.log(
//     //    'Зарегистрированные сущности:',
//     //    globalThis.dataSource.entityMetadatas.map(e => e.name)
//     //  );
//     console.log('📋 Метаданные сущностей:');
//     globalThis.dataSource.entityMetadatas.forEach(meta => {
//       console.log(`- ${meta.name} →`, meta.target);
//     });

//     console.log('DataSource initialized successfully');
//     return globalThis.dataSource;
//   } catch (error) {
//     console.error('Ошибка инициализации DataSource:', error);
//     globalThis.dataSource = undefined;
//     throw error;
//   }
// };

// export default connectDb;




// // db/database.ts
// // import { DataSource } from 'typeorm';
// import * as TypeORM from "typeorm";
// import config from './ormconfig';
// import { getEntities } from './entities';
// import { entities } from './entities'; // ✨ ДОБАВЬ ЭТО

// const connectDb = async (): Promise<TypeORM.DataSource> => {
//   try {
//     // если уже инициализирован — отдаем как есть
//     if (globalThis.dataSource && globalThis.dataSource.isInitialized) return globalThis.dataSource;

//     console.log('Initializing new DataSource...');
//     console.log('📦 Сущности при инициализации:', getEntities().map(e => e.name));

//     // ✨ ВАЖНО: при первой инициализации запоминаем ИМЕННО ЭТИ ссылки на классы
//     if (!globalThis.__entityTargetsByKey) {
//       // кладем МАПУ: ключ карты → объект-класс из ЭТОГО бандла
//       globalThis.__entityTargetsByKey = entities;
//     }

//     const updatedConfig = {
//       ...config,
//       entities: getEntities(),
//     };

//     console.log('🟡 Инициализация базы начинается');
//     console.log('getEntities()', getEntities());

//     globalThis.dataSource = new TypeORM.DataSource(updatedConfig);

//     await globalThis.dataSource.initialize()
//       .then(() => console.log('🟢 DataSource инициализирован'))
//       .catch((err) => console.error('🔴 Ошибка инициализации', err));

//     console.log('Сущности в DataSource:', updatedConfig.entities);
//     console.log('📋 Метаданные сущностей:');
//     globalThis.dataSource.entityMetadatas.forEach(meta => {
//       console.log(`- ${meta.name} →`, meta.target);
//     });

//     console.log('DataSource initialized successfully');
//     return globalThis.dataSource;
//   } catch (error) {
//     console.error('Ошибка инициализации DataSource:', error);
//     globalThis.dataSource = undefined;
//     throw error;
//   }
// };

// export default connectDb;

// // ✨ чтобы TS не ругался на кастомное поле
// declare global {
//   // eslint-disable-next-line no-var
//   var __entityTargetsByKey: typeof entities | undefined;
// }
// db/database.ts

import type { DataSource, DataSourceOptions } from "typeorm";
import config from "./ormconfig";
import { getEntities, entities } from "./entities";

const connectDb = async (): Promise<DataSource> => {
  try {
    // если уже есть инициализированный — возвращаем
    if (globalThis.dataSource && globalThis.dataSource.isInitialized) {
      return globalThis.dataSource as DataSource;
    }

    console.log("Initializing new DataSource...");
    console.log(
      "📦 Сущности при инициализации:",
      getEntities().map((e) => e.name)
    );

    if (!globalThis.__entityTargetsByKey) {
      globalThis.__entityTargetsByKey = entities;
    }

    // 🔑 ВАЖНО: динамический импорт, а не import * as TypeORM сверху
    const { DataSource } = await import("typeorm");

    const updatedConfig: DataSourceOptions = {
      ...config,
      entities: getEntities(),
    };

    console.log("🟡 Инициализация базы начинается");
    console.log("getEntities()", getEntities());

    const ds = new DataSource(updatedConfig);
    await ds.initialize();

    console.log("🟢 DataSource инициализирован");
    console.log("Сущности в DataSource:", updatedConfig.entities);
    console.log("📋 Метаданные сущностей:");
    ds.entityMetadatas.forEach((meta) => {
      console.log(`- ${meta.name} →`, meta.target);
    });

    globalThis.dataSource = ds;
    return ds;
  } catch (error) {
    console.error("Ошибка инициализации DataSource:", error);
    globalThis.dataSource = undefined;
    throw error;
  }
};

export default connectDb;

declare global {
  // eslint-disable-next-line no-var
  var __entityTargetsByKey: typeof entities | undefined;
  // eslint-disable-next-line no-var
  var dataSource: DataSource | undefined;
}
