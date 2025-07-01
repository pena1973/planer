import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/database';  // Импортируем функцию подключения
import { getUnitActions } from '@/handlers/handlers-get';  // расчеты
import { TeamTable } from '@/db/models/catalogs/teams'
import { UnitActionTable } from '@/db/models/catalogs/unit_actions'

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
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);

    // userId, teamId в любом случае

    const { userId, teamId, unitId } = req.query;

    const unitIdNumber = Array.isArray(unitId)
      ? Number(unitId[0])
      : unitId !== undefined
        ? Number(unitId)
        : undefined;

    switch (req.method) {
      case 'GET':
        const actions_ = await getUnitActions(Number(teamId), unitActionsRepository,unitIdNumber)
        // отправляем ответ
        res.status(200).json({
          success: true,
          actions: actions_,
        });

        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (unit-actions-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)