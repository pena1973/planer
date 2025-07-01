import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/database';  // Импортируем функцию подключения
import { getExceptions } from '@/handlers/handlers-get';  // расчеты

import { TeamTable } from '@/db/models/catalogs/teams'
import { UnitExceptionTable } from '@/db/models/plan/unit_exceptions'

import { UnitExceptionItem } from '@/types/types';

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
    const { userId, teamId, unitId } = req.query;

    const unitIdNumber = Array.isArray(unitId)
      ? Number(unitId[0])
      : unitId !== undefined
        ? Number(unitId)
        : undefined;

    switch (req.method) {
      case 'GET':
        const exceptions_ = await getExceptions(Number(teamId), unitExceptionsRepository,unitIdNumber,)

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