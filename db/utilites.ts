// db/utilites.ts
import { DataSource, Repository, ObjectLiteral, EntityTarget } from 'typeorm';

import { entities } from './entities';

export const getRepositoryByName = <T extends ObjectLiteral>(
  db: DataSource,
  name: keyof typeof entities
): Repository<T> => {
  const entity = entities[name];
  if (!entity) throw new Error(`Entity "${name}" not found`);
  return db.getRepository<T>(entity);
};

// export function getTypedRepository<T extends ObjectLiteral>(
//   db: DataSource,
//   name: string,
//   ctor: EntityTarget<T>, // может быть класс или строка
// ): Repository<T> {
//   try {
//     // Если в dev-режиме и ctor — это класс, можно дополнительно проверить соответствие по имени
//     if (process.env.NODE_ENV !== 'production') {
//       const meta = db.entityMetadatas.find(m => {
//         const targetName = typeof m.target === 'function' ? m.target.name : String(m.target);
//         return targetName === name;
//       });

//       if (!meta) {
//         const available = db.entityMetadatas.map(m =>
//           typeof m.target === 'function' ? m.target.name : String(m.target)
//         );
//         throw new Error(`Entity "${name}" not found. Registered: [${available.join(', ')}]`);
//       }

//       return db.getRepository<T>(meta.target as EntityTarget<T>);
//     }

//     // В проде просто используем ctor
//     return db.getRepository<T>(ctor);
//   } catch (err) {
//     const registered = db.entityMetadatas.map(m =>
//       typeof m.target === 'function' ? m.target.name : String(m.target)
//     );
//     const targetName = typeof ctor === 'function' ? ctor.name : String(ctor);
//     throw new Error(`Entity "${targetName}" not found. Registered: [${registered.join(', ')}]`);
//   }
// }





// Типы — чтобы репозиторий типизировался от ключа

type EntitiesMap = typeof entities;
type EntityFor<K extends keyof EntitiesMap> = InstanceType<EntitiesMap[K]>;

export function getTypedRepository<K extends keyof EntitiesMap>(
  db: DataSource,
  key: K,
  _cls?: any // оставляем для совместимости, игнорируем
): Repository<EntityFor<K>> {
  // ✨ Берём класс из глобальной карты (т.е. из того бандла, где DS инициализирован),
  // если её ещё нет — используем локальную.
  const targets = (globalThis as any).__entityTargetsByKey ?? entities;
  const entityClass = targets[key] as any;
  return db.getRepository(entityClass);
}
