import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getExceptions } from './handlers-get';  // расчеты

import { Repository, In } from 'typeorm';
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions'

import { UnitItem, UnitExceptionItem } from '@/types';

interface RequestBody {
  exceptions: UnitExceptionItem
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(TeamTable);
    // const unitRepository = dbConnection.getRepository(UnitTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);

    // userId, teamId в любом случае
    const { userId, teamId } = req.query;

    switch (req.method) {
      case 'GET':
        const exceptions_ = await getExceptions(Number(teamId), unitExceptionsRepository)

        exceptions_.sort((a, b) => {
          // Проверяем, что даты определены
          if (a.date === undefined || b.date === undefined) {
            return 0; // Если дата не определена, оставляем элементы на своих местах
          }
          
          // Сортируем по дате (по возрастанию)
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        // отправляем ответ
        res.status(200).json({
          success: true,
          exceptions: exceptions_,
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

export default withAuth(handler)