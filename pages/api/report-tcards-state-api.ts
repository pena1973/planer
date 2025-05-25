import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { getTCardsTerms, getUnitLoads, getUnits } from './handlers-get';  // 
import { UnitTable } from '@/pages/db/models/catalogs/units'
import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { StatusEnum } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const teamRepository = dbConnection.getRepository(TeamTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);


    // userId, teamId в любом случае
    const { userId, teamId, tCardNumber, tCardDateFrom, tCardDateTo, tCardStatus } = req.query;
    // Проверяем, что tCardStatus является допустимым значением для StatusEnum

    const status = Object.values(StatusEnum).includes(tCardStatus as StatusEnum) ? tCardStatus as StatusEnum : undefined;

    switch (req.method) {
      case 'GET':

        // получаем карты с операциями
        const { terms, loads } = await getTCardsTerms(
          Number(teamId),
          Number(tCardNumber),
          tCardDateFrom as string,
          tCardDateTo as string,
          status,
          tCardRepository,
          tCardOperationsRepository,
          tCardProductRepository,
          unitLoadRepository)
        if (!terms) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          tCards: terms,
          unitLoadItems: loads,
          messsage: ""
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (tcards-opers-terms-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

