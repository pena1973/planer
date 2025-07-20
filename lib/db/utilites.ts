
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

// // Для DEV
// export function getTypedRepository<T extends ObjectLiteral>(
//   db: DataSource,
//   name: string,
//   ctor: { new (): T } // typeof T, т.е. класс сущности
// ): Repository<T> {
//   const meta = db.entityMetadatas.find(m => m.name === name);
//   if (!meta) {
//     throw new Error(`Entity "${name}" not found in DataSource`);
//   }

//   // Явное указание типа класса (typeof T)
//   return db.getRepository(meta.target as typeof ctor) as Repository<T>;
// }

// // Для PROD
// export function getTypedRepository<T extends ObjectLiteral>(
//   db: DataSource,
//   name: string,
//   ctor: EntityTarget<T>, // может быть Function или строкой (но чаще всего — класс)
// ): Repository<T> {
//   try {
//     return db.getRepository<T>(ctor);
//   } catch (err) {
//     const entityNames = db.entityMetadatas.map(meta => {
//       const name = typeof meta.target === 'function'
//         ? meta.target.name
//         : String(meta.target); // может быть строка
//       return name;
//     }).join(', ');

//     const targetName = typeof ctor === 'function'
//       ? ctor.name
//       : String(ctor);

//     throw new Error(
//       `Entity "${targetName}" not found in DataSource. `
//       + `Зарегистрированные: [${entityNames}]`
//     );
//   }
// }


export function getTypedRepository<T extends ObjectLiteral>(
  db: DataSource,
  name: string,
  ctor: EntityTarget<T>, // может быть класс или строка
): Repository<T> {
  try {
    // Если в dev-режиме и ctor — это класс, можно дополнительно проверить соответствие по имени
    if (process.env.NODE_ENV !== 'production') {
      const meta = db.entityMetadatas.find(m => {
        const targetName = typeof m.target === 'function' ? m.target.name : String(m.target);
        return targetName === name;
      });

      if (!meta) {
        const available = db.entityMetadatas.map(m =>
          typeof m.target === 'function' ? m.target.name : String(m.target)
        );
        throw new Error(`Entity "${name}" not found. Registered: [${available.join(', ')}]`);
      }

      return db.getRepository<T>(meta.target as EntityTarget<T>);
    }

    // В проде просто используем ctor
    return db.getRepository<T>(ctor);
  } catch (err) {
    const registered = db.entityMetadatas.map(m =>
      typeof m.target === 'function' ? m.target.name : String(m.target)
    );
    const targetName = typeof ctor === 'function' ? ctor.name : String(ctor);
    throw new Error(`Entity "${targetName}" not found. Registered: [${registered.join(', ')}]`);
  }
}
