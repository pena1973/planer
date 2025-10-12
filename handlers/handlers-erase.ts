
import { ulogger } from "./../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';
import { Repository, In, Raw, LessThan } from 'typeorm';

import { UnitLoadTable } from './../db/models/plan/unit_loads';
// types
import { UnitLoadItem, TCardOperationItem, StatusEnum } from './../types/types';
import { YYYYMMDD } from "@/lib/common/utils"
import { getStatusPriority } from "./../lib/common/utils"

// отменяет запланированные лоады по id операции (история)

export const cancelHistoryLoadsByOperIds = async (
  userId: number,
  locale: string,
  cancellOperIds: number[],
  today: string, // "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean, message: string }> => {
  const t = getServerT(locale, 'translation');
  try {
    if (cancellOperIds.length === 0) {
      return { success: true, message: t('mes.NoOpersToCancel') };
    }

    await unitLoadRepository.update(
      {
        id_oper: In(cancellOperIds),
        status: StatusEnum.planed,
        date: LessThan(today),
      },
      { status: StatusEnum.cancelled }
    );

    return { success: true, message: t('mes.loadsUpdated') };
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');
    void ulogger.error({
      userId,
      location: "handlers/handlers-erase/cancelHistoryLoadsByOperIds",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "cancelHistoryLoadsByOperIds",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
};


// Удаляет запланированные лоады по id операции (будущее)
export const deleteFutureLoadsByOperIds = async (
  userId: number,
  locale: string,
  delOperIds: number[],
  today: string, // "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean, message: string }> => {
  const t = getServerT(locale, 'translation');

  try {

    if (delOperIds.length === 0)
      return {
        success: true,
        // message: `Нет операций для удаления.` 
        message: t('mes.noOperForDelete')
      };

    const result = await unitLoadRepository
      .createQueryBuilder()
      .delete()
      .where("id_oper IN (:...delOperIds)", { delOperIds })
      .andWhere("status = :status", { status: StatusEnum.planed })
      .andWhere("date >= :today", { today })
      .execute();

    return {
      success: true,
      message: `${t('mes.loadsDeleted')}`
    };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-erase/deleteFutureLoadsByOperIds",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "deleteFutureLoadsByOperIds",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
};

// Вычисляет статус Т-карты по статусам её операций (учитывая связи дефект→исправление)
export async function calculateTCardStatusByOperations(
  userId: number,
  locale: string,
  currentStatus: StatusEnum,
  tCardOperations: TCardOperationItem[],
): Promise<{ success: boolean; status: StatusEnum; message: string }> {

  const t = getServerT(locale, 'translation');

  try {
    if (!Array.isArray(tCardOperations) || tCardOperations.length === 0) {
      // нет операций — считаем карту готовой (или поменяй на нужный базовый статус)
      return { success: true, status: currentStatus, message: '' };
    }


    // индекс исправляющих операций по fixOperIdc
    const fixByTargetIdc = new Map<number, TCardOperationItem>();
    for (const op of tCardOperations) {
      if (op.fixOperIdc != null) fixByTargetIdc.set(op.fixOperIdc, op);
    }

    // рекурсивная функция: второй аргумент — именно Set, НО мы её не передаём в map напрямую
    const resolveFinalStatus = (op: TCardOperationItem, seen: Set<number>): StatusEnum => {
      if (op.status !== StatusEnum.defective) return op.status;

      const idc = op.idc;
      if (idc == null || seen.has(idc)) return StatusEnum.defective;

      seen.add(idc);
      const fixOp = fixByTargetIdc.get(idc);
      return fixOp ? resolveFinalStatus(fixOp, seen) : StatusEnum.defective;
    };

    // ✅ обёртка для map — теперь сигнатура (op) => StatusEnum
    const operationStatuses: StatusEnum[] =
      tCardOperations.map(op => resolveFinalStatus(op, new Set<number>()));


    // Минимальный по приоритету статус — статус карты
    const finalCardStatus = operationStatuses.reduce(
      (best, cur) => (getStatusPriority(cur) < getStatusPriority(best) ? cur : best),
      StatusEnum.ready, // стартуем с "наивысшего" статуса
    );

    return { success: true, status: finalCardStatus, message: '' };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: 'handlers/handlers-erase/calculateTCardStatusByOperations',
      event: 'db_error',
      message: `catch: ${msg}`,
      context: 'calculateTCardStatusByOperations',
    }).catch(() => { console.error('logger error'); });

    return { success: false, status: currentStatus, message: 'db_error: ' + msg };
  }
}


// отмена лоадов
export const cancelHistoryLoads = async (
  userId: number,
  locale: string,
  cancellLoads: UnitLoadItem[],
  today: string, // формат "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean; message: string }> => {
  const t = getServerT(locale, 'translation');

  try {
    const loadIds = cancellLoads
      .map(load => load.id)
      .filter((id): id is number => id !== undefined);

    if (loadIds.length === 0) {
      return { success: true, message: 'Нет загрузок для отмены.' };
    }

    const result = await unitLoadRepository.update(
      {
        id: In(loadIds),
        status: StatusEnum.planed,
        date: Raw(dateField => `${dateField} < :today`, { today })
      },
      { status: StatusEnum.cancelled }
    );

    return {
      success: true,
      message: `${t('mes.loadsUpdated')}`
    };


  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-erase/cancelLoads",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "cancelLoads",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
};
// удаление лоадов
export const deleteFutureLoads = async (
  userId: number,
  locale: string,
  delLoads: UnitLoadItem[],
  today: string, // формат "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean; message: string }> => {
  const t = getServerT(locale, 'translation');
  try {
    const loadIds = delLoads.map(load => load.id).filter((id): id is number => id !== undefined);

    if (loadIds.length === 0) {
      return { success: true, message: 'Нет загрузок для удаления.' };
    }

    const result = await unitLoadRepository.delete({
      id: In(loadIds),
      status: StatusEnum.planed,
      date: Raw(dateField => `${dateField} >= :today`, { today })
    });

    return {
      success: true,
      message: `${t('mes.loadsDeleted')}`
    };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-erase/deleteLoads",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "deleteLoads",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
};

