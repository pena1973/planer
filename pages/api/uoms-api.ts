import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'

import { updateUOMS } from './../../handlers/handlers-update';  // расчеты
import { UOMsTable } from './../../db/models/catalogs/uoms';
import { UOMItem } from './../../types/types';
import { getUOMs } from './../../handlers/handlers-get';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number,
  uoms: UOMItem[];
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const uomsRepository = getTypedRepository(db, 'UOMsTable', UOMsTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    
    switch (req.method) {
      case 'GET':
        const { teamId: teamIdget, userId:userIdget } = req.query;
        const uoms__ = await getUOMs(Number(userIdget), locale, Number(teamIdget), uomsRepository)

        uoms__.sort((a, b) => {
          // Проверяем, что id определено
          if (a.id === undefined || b.id === undefined) {
            return 0; // Если id не определено, оставляем элементы на своих местах
          }
          return a.id - b.id; // Сортировка по id
        });

        // отправляем ответ
        res.status(200).json({
          success: true,
          uoms: uoms__,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { uoms, userId, teamId } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resUOMS = await updateUOMS(
          Number(userId), locale, 
          uomsRepository,
          uoms,
          Number(teamId)
        )
        if (!resUOMS.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUOMS.message });
          return;
        }

        const savedUOMs = resUOMS.savedUOMS as UOMsTable[];

        const uoms_ = savedUOMs
          .map(uom => {
            return {
              id: uom.id,
              title: uom.title,
              code: uom.code
            };
          });

        // отправляем ответ
        res.status(200).json({
          success: true,
          uoms: uoms_,
        });
        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (uoms-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)