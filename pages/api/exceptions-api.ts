import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getExceptions } from './handlers';  // расчеты

import { Repository, In } from 'typeorm';
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UnitExceptionTable } from '@/pages/db/models/plan/unit-exceptions'

import { UnitItem, UnitExceptionItem } from '@/types';

interface RequestBody {
  exceptions: UnitExceptionItem
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(CompanyTable);
    // const unitRepository = dbConnection.getRepository(UnitTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);

    // userId, companyId в любом случае
    const { userId, companyId } = req.query;

    switch (req.method) {
      case 'GET':
        const exceptions_ = await getExceptions(Number(companyId), unitExceptionsRepository)

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
    console.error('Ошибка подключения или выполнения запроса:', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

