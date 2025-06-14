import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { BillTable } from '@/pages/db/models/support/bills';

import { BillItem } from '@/types';
import { getBills } from './handlers-get';  // расчеты

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const billsRepository = dbConnection.getRepository(BillTable);

    const { teamId: getTeamId } = req.query;
    switch (req.method) {
      case 'GET':
        const bills__ = await getBills(Number(getTeamId), billsRepository)

        bills__.sort((a, b) => {
          // Проверяем, что id определено
          if (a.id === undefined || b.id === undefined) {
            return 0; // Если id не определено, оставляем элементы на своих местах
          }
          return a.id - b.id; // Сортировка по id
        });

        // отправляем ответ
        res.status(200).json({
          success: true,
          bills: bills__,
          message: ""
        });

        break;

      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (billing-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)