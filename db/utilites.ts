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
