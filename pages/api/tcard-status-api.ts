// Корректировка текущего статуса карты по ее состоянию в БД
import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../lib/db/utils'

import { TCardTable } from './../../db/models/data/t_cards'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'

import { TCardOperationItem, StatusEnum } from './../../types/types';
import { updateStatusTCard} from './../../handlers/handlers-update';
import { getTCard, getTCardOperationsByCardId} from './../../handlers/handlers-get';

import { getStatusPriority } from "./../../lib/utils"

interface RequestBody {
  tCardId: number,
  teamId: number,
  userId: number
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const db = await connectDb(); 
    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
    const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);

  try {
        
    switch (req.method) {
      case 'POST':

        // Извлекаем данные из тела запроса
        const { tCardId, teamId, userId } = req.body as RequestBody;

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
    
        // Рекурсивное определение "фактического" статуса операции
        const resolveFinalStatus = (op: TCardOperationItem): StatusEnum => {
          if (op.status === StatusEnum.defective) {
            const fixOp = tCardOperations.find(o => o.fixOperIdc === op.idc);
            if (fixOp) return resolveFinalStatus(fixOp);
          }
          return op.status;
        };

        // Находим статус с минимальным приоритетом среди всех операций
        const operationStatuses = tCardOperations.map(resolveFinalStatus);

        const finalCardStatus = operationStatuses.reduce((minStatus, currentStatus) => {
          return getStatusPriority(currentStatus) < getStatusPriority(minStatus)
            ? currentStatus
            : minStatus;
        }, StatusEnum.ready); // Начинаем с наивысшего статуса

        // / Обновим статус карты если он изменился
        if (tCard.status !== finalCardStatus) {
          const resCard = await updateStatusTCard(tCardRepository, tCardId, finalCardStatus);
          if (!resCard.success) {
            res.status(200).json({
              success: false,
              message: 'Статус карты не обновлен',
            });
            break;
          }
        }

        res.status(200).json({
          success: true,
          tCardStatus: finalCardStatus,
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