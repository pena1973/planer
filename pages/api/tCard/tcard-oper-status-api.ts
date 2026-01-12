//pages/api/tCard/tcard-oper-status-api
// API для изменения статуса карты
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from './../../../lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getStatusPriority } from "./../../../lib/common/utils"
import { TCardTable } from './../../../db/models/data/t_cards'
import { TCardOperationTable } from './../../../db/models/data/t_card_operations'
import { UnitLoadTable } from './../../../db/models/plan/unit_loads';

import { TCardOperationItem, StatusEnum } from './../../../types/types';

import { updateStatusOperationByOperId, updateStatusLoads, updateStatusTCard } from './../../../handlers/handlers-update';
import { getTCard, getTCardOperationsByCardId, getTCardOperationLoads } from './../../../handlers/handlers-get';

interface RequestBody {
  tCardId: number,
  operId: number,
  version: number,
  status: StatusEnum,
  teamId: number,
  userId: number

}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
    const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
    const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); 


    switch (req.method) {
      case 'POST':

        // Извлекаем данные из тела запроса
        const { tCardId, operId, version, status, teamId, userId } = req.body as RequestBody;

        //Обновляем СТАТУС ОПЕРАЦИИ       
        const resOperation = await updateStatusOperationByOperId(Number(userId), locale, tCardOperationsRepository, operId, status)
        if (!resOperation.success) {
          res.status(200).json({
            success: false,
            message: resOperation.message,
          });
          break;
        }

        //  получим лоады операции заданной версии планирования
        const operLoadsIds = await getTCardOperationLoads(Number(userId), locale, tCardId, operId, version, unitLoadRepository)

        if (operLoadsIds.length > 0) {
          //Обновляем СТАТУС ЛОАДОВ этой версии планирования
          const resLoads = await updateStatusLoads(Number(userId), locale, unitLoadRepository, operLoadsIds, status)
          if (!resLoads.success) {
            res.status(200).json({
              success: false,
              message: resLoads.message,
            });
            break;
          }
        }

        // проверяем все операции карты и если  статусы не ниже текущего  меняем статус самой карты
        const tCardOperations = await getTCardOperationsByCardId(Number(userId), locale, tCardId, tCardOperationsRepository)

        const tCard = await getTCard(Number(userId), locale, tCardId, tCardRepository)
        if (!tCard) {
          res.status(200).json({
            success: false,
            message: t("mes.tCardNotFound"),
          });
          break;
        }

        // «Эффективный» статус операции с учётом исправлений
        function getEffectiveOperationStatus(
          op: TCardOperationItem,
          all: TCardOperationItem[],
          seen = new Set<number>(), // по idc
        ): StatusEnum {
          // если не брак — просто возвращаем статус
          if (op.status !== StatusEnum.defective) return op.status;

          // защита от циклов
          if (seen.has(op.idc)) return StatusEnum.defective;
          seen.add(op.idc);

          // ищем исправляющие операции ДЛЯ этой (важное направление!)
          const fixes = all.filter(o => o.fixOperIdc === op.idc);

          // нет исправления — остаётся брак
          if (fixes.length === 0) return StatusEnum.defective;

          // если исправлений несколько — берём «лучшее» по приоритету
          // (или выбери нужную стратегию: последнюю по времени и т.п.)
          const bestFix = fixes.reduce((best, cand) =>
            getStatusPriority(cand.status) > getStatusPriority(best.status) ? cand : best,
            fixes[0]
          );

          // если и исправляющая — брак, идём дальше по цепочке
          return getEffectiveOperationStatus(bestFix, all, seen);
        }

        // ==== расчёт статуса карты как минимума «эффективных» статусов ====
        const opsForStatus = tCardOperations.filter(op => op.status !== StatusEnum.cancelled);

        let newCardStatus = tCard.status;
        if (opsForStatus.length > 0) {
          const effectiveStatuses = opsForStatus.map(op => getEffectiveOperationStatus(op, tCardOperations));

          const minStatus = effectiveStatuses.reduce((acc, st) => {
            return getStatusPriority(st) < getStatusPriority(acc) ? st : acc;
          }, StatusEnum.closed);

          newCardStatus = minStatus;
        }

        // Обновляем карту, только если поменялся
        if (tCard.status !== newCardStatus) {
          const resCard = await updateStatusTCard(Number(userId), locale, tCardRepository, tCardId, newCardStatus);
          if (!resCard.success) {
            res.status(200).json({ success: false, message: resCard.message });
            break;
          }
        }

        res.status(200).json({
          success: true,
          operLoadsIds,
          tCardStatus: newCardStatus,
          message: t('mes.tCardUpdated'),
        });


        break;

      default:
        res.status(405).json({ error: 'Method not supported.' });
    }

  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/tCard/tcard-oper-status-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}


export default withAuth(handler)