import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../lib/db/utilites'

import { getStatusPriority } from "./../../lib/utils"
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
  const db = await connectDb();
  const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
  const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);

  try {

    switch (req.method) {
      case 'POST':

        // Извлекаем данные из тела запроса
        const { tCardId, operId, version, status, teamId, userId } = req.body as RequestBody;

        //Обновляем СТАТУС ОПЕРАЦИИ
        const resOperation = await updateStatusOperationByOperId(tCardOperationsRepository, operId, status)
        if (!resOperation.success) {
          res.status(200).json({
            success: false,
            message: 'Операция не обновлена',
          });
          break;
        }

        //  получим лоады операции заданной версии планирования
        const operLoadsIds = await getTCardOperationLoads(tCardId, operId, version, unitLoadRepository)


        if (operLoadsIds.length > 0) {
          //Обновляем СТАТУС ЛОАДОВ этой версии планирования
          const resLoads = await updateStatusLoads(unitLoadRepository, operLoadsIds, status)
          if (!resLoads.success) {
            res.status(200).json({
              success: false,
              message: 'Интервалы не обновлены',
            });
            break;
          }
        }
        // проверяем все операции карты и если  статусы не ниже текущего  меняем статус самой карты
        const tCardOperations = await getTCardOperationsByCardId(tCardId, tCardOperationsRepository)

        const tCard = await getTCard(tCardId, tCardRepository)
        if (!tCard) {
          res.status(200).json({
            success: false,
            message: 'Карта не найдена',
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
          const resCard = await updateStatusTCard(tCardRepository, tCardId, tCardStatus)
          if (!resCard.success) {
            res.status(200).json({
              success: false,
              message: 'Статус карты не обновлен',
            });
            break;
          }
        }
        // отправляем ответ
        res.status(200).json({
          success: true,
          operLoadsIds: operLoadsIds,
          tCardStatus: tCardStatus,
          message: 'Карта успешно обновлена',
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (tcard-oper-status-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}
export default withAuth(handler)