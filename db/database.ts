
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
