
// import { DataSource, Repository, EntityTarget, ObjectLiteral } from 'typeorm';

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
