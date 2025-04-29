import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnitActions } from './handlers-get';  // расчеты

import { Repository, In } from 'typeorm';
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'

import { UnitItem, UnitExceptionItem } from '@/types';

interface RequestBody {
  exceptions: UnitExceptionItem
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(TeamTable);
    // const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);

    // userId, teamId в любом случае
    const { userId, teamId } = req.query;

    switch (req.method) {
      case 'GET':
        const actions_ = await getUnitActions(Number(teamId), unitActionsRepository)
        // отправляем ответ
        res.status(200).json({
          success: true,
          exceptions: actions_,
        });

        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (exception-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

