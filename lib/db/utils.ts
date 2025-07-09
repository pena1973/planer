
 import { DataSource, Repository, EntityTarget, ObjectLiteral } from 'typeorm';

// export function getRepositoryByClass<T extends ObjectLiteral>(
//   dataSource: DataSource,
//   entity: EntityTarget<T>
// ): Repository<T> {
//   const meta = dataSource.entityMetadatas.find(m => m.target === entity);
//   if (!meta) {
//     const name = typeof entity === 'function' ? entity.name : '[unknown]';
//     throw new Error(`Сущность "${name}" не найдена в DataSource`);
//   }
//   return dataSource.getRepository<T>(meta.target);
// }


import { entities } from './entities';

export const getRepositoryByName = <T extends ObjectLiteral>(
  db: DataSource,
  name: keyof typeof entities
): Repository<T> => {
  const entity = entities[name];
  if (!entity) throw new Error(`Entity "${name}" not found`);
  return db.getRepository<T>(entity);
};


export function getTypedRepository<T extends ObjectLiteral>(
  db: DataSource,
  name: string,
  ctor: { new (): T } // typeof T, т.е. класс сущности
): Repository<T> {
  const meta = db.entityMetadatas.find(m => m.name === name);
  if (!meta) {
    throw new Error(`Entity "${name}" not found in DataSource`);
  }

  // Явное указание типа класса (typeof T)
  return db.getRepository(meta.target as typeof ctor) as Repository<T>;
}

// export function getTypedRepository<T extends ObjectLiteral>(
//   db: DataSource,
//   name: string
// ): Repository<T> {
//   const meta = db.entityMetadatas.find(m => m.name === name);
//   if (!meta) throw new Error(`Entity "${name}" not found in DataSource`);

//   return db.getRepository(meta.target as EntityTarget<T>) as Repository<T>;
// }