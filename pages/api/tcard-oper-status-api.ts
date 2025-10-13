//pages/api/tcard-oper-status-api
// API для изменения статуса карты
// Используется в 

import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'

import { getStatusPriority } from "./../../lib/common/utils"
import { TCardTable } from './../../db/models/data/t_cards'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'
import { UnitLoadTable } from './../../db/models/plan/unit_loads';

import { TCardOperationItem, StatusEnum } from './../../types/types';

import { updateStatusOperationByOperId, updateStatusLoads, updateStatusTCard } from './../../handlers/handlers-update';
import { getTCard, getTCardOperationsByCardId, getTCardOperationLoads } from './../../handlers/handlers-get';

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
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'


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
        // Проверка всех операций карты: если все не ниже текущего статуса
        const isAllOperationsNotLowerThanStatus = tCardOperations.every(operation => {
          // Функция для рекурсивной проверки статуса
          const checkOperationStatus = (op: TCardOperationItem): boolean => {
            if (op.status === StatusEnum.defective) {
              const fixOperation = tCardOperations.find(o => o.fixOperIdc === op.idc);
              if (fixOperation) {
                // Если исправляющая операция тоже дефектная, продолжаем цепочку
                return checkOperationStatus(fixOperation);
              } else {
                // Если исправляющей операции нет или она не дефектная, возвращаем статус операции
                return getStatusPriority(op.status) >= getStatusPriority(status);
              }
            } else {
              // Если операция не дефектная, просто возвращаем её статус
              return getStatusPriority(op.status) >= getStatusPriority(status);
            }
          };

          // Применяем проверку для текущей операции
          return checkOperationStatus(operation);
        });

        const tCardStatus = (isAllOperationsNotLowerThanStatus) ? status : tCard.status

        // обновим статус карты если изменился
        if (tCard.status !== tCardStatus) {
          const resCard = await updateStatusTCard(Number(userId), locale, tCardRepository, tCardId, tCardStatus)
          if (!resCard.success) {
            res.status(200).json({
              success: false,
              message: resCard.message,
            });
            break;
          }
        }
        // отправляем ответ
        res.status(200).json({
          success: true,
          operLoadsIds: operLoadsIds,
          tCardStatus: tCardStatus,
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
      location: "pages/api/tcard-oper-status-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}
export default withAuth(handler)