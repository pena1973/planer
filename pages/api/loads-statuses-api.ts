
import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../db/utilites'

import { getLoadStatuses} from './../../handlers/handlers-get';  // расчеты

import { UnitLoadTable } from '../../db/models/plan/unit_loads';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();

  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);

  try {

    // userId, teamId в любом случае
    const { userId, teamId} = req.query;

    switch (req.method) {
      case 'GET':
        //  получим юниты с загрузкой  до планирования новой карты         
        const unitsLoadStatuses = await getLoadStatuses( Number(teamId),unitLoadRepository,)
        
        // Отправляем ответ с данными  в базе их нет это только драфт
        res.status(200).json({
          success: true,
          unitsLoadStatuses: unitsLoadStatuses,          
        });
        break;

      case 'POST':

        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (loads-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}

export default withAuth(handler)