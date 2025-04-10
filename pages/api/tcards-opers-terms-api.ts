import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { getTCardsOpers, } from './handlers-get';  // 

import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UnitLoadTable } from '@/pages/db/models/plan/unit-loads';
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(CompanyTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);


    // userId, companyId в любом случае
    const { userId, companyId, tcardId } = req.query;

    switch (req.method) {
      case 'GET':

        // получаем полную карту со всеми входящими и исходящими
        const tCards = await getTCardsOpers(Number(companyId),tCardRepository, tCardOperationsRepository, tCardProductRepository, unitLoadRepository)
        if (!tCards) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }


        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          tCards: tCards,
          messsage: ""
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

