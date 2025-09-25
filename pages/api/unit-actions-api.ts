import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/translate/locale';
import { getTypedRepository } from './../../db/utilites'

import { getUnitActions } from './../../handlers/handlers-get';  // расчеты
import { UnitActionTable } from './../../db/models/catalogs/unit_actions'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
    const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'GET':
        const { userId, teamId, unitId } = req.query;

        const actions_ = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository, Number(unitId))
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