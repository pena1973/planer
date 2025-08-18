

// cleanup-core.ts

import { Repository } from 'typeorm';
import { TCardTable } from '../models/data/t_cards';
import { TCardOperationTable } from '../models/data/t_card_operations';
import { TCardProductTable } from '../models/data/t_card_products';
import { ProductTable } from '../models/data/products';
import { TCardStageTable } from '../models/data/t_card_stages';
import { UnitLoadTable } from '../models/plan/unit_loads';

type CleanupRepositories = {
  unitLoads: Repository<UnitLoadTable>;
  tCards: Repository<TCardTable>;
  tCardOperations: Repository<TCardOperationTable>;
  tCardProducts: Repository<TCardProductTable>;
  tCardStages: Repository<TCardStageTable>;
  products: Repository<ProductTable>;
};

type CleanupStats = {
  cutoff: string;
  loadsDeleted: number;
  tCardsDeleted: number;
  tCardOperationsDeleted: number;
  tCardProductsDeleted: number;
  tCardStagesDeleted: number;
  productsDeleted: number;
};

export async function cleanupOldLoadsAndCards(
  repositories: CleanupRepositories
): Promise<{ success: boolean; message: string; stats: CleanupStats }> {
  // 90 дней фиксировано
  const retentionDays = 90;
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  // Формат 'en-CA' => YYYY-MM-DD (совместим с твоим хранением)
  const cutoff = cutoffDate.toLocaleDateString('en-CA');

  // 1) t_card_id, у которых будут удалены лоады
  const candidates = await repositories.unitLoads
    .createQueryBuilder('u')
    .select('DISTINCT u.t_card_id', 't_card_id')
    .where(`u."date" < :cutoff`, { cutoff })
    .getRawMany<{ t_card_id: number }>();

  const candidateCardIds = candidates.map(r => r.t_card_id).filter((x): x is number => Number.isFinite(x));

  // 2) Удаляем старые лоады
  const delLoads = await repositories.unitLoads
    .createQueryBuilder()
    .delete()
    .from(repositories.unitLoads.metadata.tableName) // надёжно по имени таблицы
    .where(`"date" < :cutoff`, { cutoff })
    .execute();
  const loadsDeleted = delLoads.affected ?? 0;

  // 3) Карты, у которых после шага (2) не осталось ни одного лоада
  let emptyCardIds: number[] = [];
  if (candidateCardIds.length > 0) {
    const rows = await repositories.tCards
      .createQueryBuilder('c')
      .select('c.id', 'id')
      .where('c.id IN (:...ids)', { ids: candidateCardIds })
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM "${repositories.unitLoads.metadata.tableName}" u WHERE u.t_card_id = c.id)`
      )
      .getRawMany<{ id: number }>();
    emptyCardIds = rows.map(r => r.id);
  }

  // 4) Удаляем подчинённые и саму карту — ТОЛЬКО для пустых карт
  let opsDeleted = 0, tProdsDeleted = 0, stagesDeleted = 0, prodsDeleted = 0, cardsDeleted = 0;
  if (emptyCardIds.length > 0) {
    opsDeleted = (await repositories.tCardOperations.createQueryBuilder().delete()
      .where('t_card_id IN (:...ids)', { ids: emptyCardIds }).execute()).affected ?? 0;

    tProdsDeleted = (await repositories.tCardProducts.createQueryBuilder().delete()
      .where('t_card_id IN (:...ids)', { ids: emptyCardIds }).execute()).affected ?? 0;

    stagesDeleted = (await repositories.tCardStages.createQueryBuilder().delete()
      .where('t_card_id IN (:...ids)', { ids: emptyCardIds }).execute()).affected ?? 0;

    prodsDeleted = (await repositories.products.createQueryBuilder().delete()
      .where('t_card_id IN (:...ids)', { ids: emptyCardIds }).execute()).affected ?? 0;

    cardsDeleted = (await repositories.tCards.createQueryBuilder().delete()
      .where('id IN (:...ids)', { ids: emptyCardIds }).execute()).affected ?? 0;
  }

  const stats: CleanupStats = {
    cutoff,
    loadsDeleted,
    tCardsDeleted: cardsDeleted,
    tCardOperationsDeleted: opsDeleted,
    tCardProductsDeleted: tProdsDeleted,
    tCardStagesDeleted: stagesDeleted,
    productsDeleted: prodsDeleted,
  };

  return {
    success: true,
    message:
      `Чистка завершена (до ${cutoff}): loads=${loadsDeleted}, ` +
      `t_cards=${cardsDeleted}, ops=${opsDeleted}, products=${prodsDeleted}, stages=${stagesDeleted}`,
    stats,
  };
}
