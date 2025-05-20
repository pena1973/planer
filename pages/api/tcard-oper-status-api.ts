import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';

import { TCardItem, TCardProductItem, TCardOperationItem, TCardStageItem, UnitLoadItem, StatusEnum } from '@/types';

import { updateStatusOperation, updateStatusLoads, updateStatusTCard } from '@/pages/api/handlers-update';
import { getTCard, getTCardOperationsByCardId, getTCardOperationLoads } from '@/pages/api/handlers-get';
import { getStatusPriority } from "@/utils"

interface RequestBody {
  tCardId: number,
  operId: number,
  version: number,
  status: StatusEnum,
  teamId: number,
  userId: number

}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    // const companiesRepository = dbConnection.getRepository(TeamTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    // userId, teamId в любом случае
    // const { userId, teamId, tcardId } = req.query;

    switch (req.method) {
      case 'POST':

        // Извлекаем данные из тела запроса
        const { tCardId, operId, version, status, teamId, userId } = req.body as RequestBody;

        //Обновляем СТАТУС ОПЕРАЦИИ
        const resOperation = await updateStatusOperation(tCardOperationsRepository, operId, status)
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
          return getStatusPriority(operation.status) >= getStatusPriority(status);
        });

        let tCardStatus = (isAllOperationsNotLowerThanStatus) ? status : tCard.status

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
          operLoadsIds:operLoadsIds,
          tCardStatus: tCardStatus,
          message: 'Карта успешно обновлена',
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (tcard-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}
