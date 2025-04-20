// Это вариант АПИ по обработке карты оптимизированный того что без 1 в имени, потом надо остальное переделать
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { TCardTable } from '@/pages/db/models/data/t_cards'
// import { TCardStageTable } from '@/pages/db/models/data/t_card_stages'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { TeamTable } from '@/pages/db/models/catalogs/teams'

// import { TypeEnum } from '@/pages/db/models/enums';
// import { TCardItem, TCardProductItem, TCardOperationItem, TCardStageItem } from '@/types';
import { getTCardFull, } from './handlers-get';  // 


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(TeamTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);

    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);


    // userId, teamId в любом случае
    const { userId, teamId, tCardId } = req.query;

    //  можно заменить на getTCardFull

    switch (req.method) {
      case 'GET':

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(Number(tCardId), tCardRepository, tCardOperationsRepository, tCardProductRepository)
        if (!tCard) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        
        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          tCard: tCard,
          messsage: ""
        });
        break;


      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (tcard-api1):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}


