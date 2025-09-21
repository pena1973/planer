import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../db/database';

import { getTypedRepository } from './../../db/utilites'
import { ActionTable } from './../../db/models/catalogs/actions';
import { ActionItem } from './../../types/types';
import { getActions } from './../../handlers/handlers-get';
import { updateActions } from './../../handlers/handlers-update';

interface RequestBody {
  userId: number,
  teamId: number,
  actions: ActionItem[];
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const actionsRepository = getTypedRepository(db, 'ActionTable', ActionTable);

  try {

    const { teamId: getTeamId } = req.query;

    switch (req.method) {
      case 'GET':
        const actions__ = await getActions(Number(getTeamId), actionsRepository)

        actions__.sort((a, b) => a.id - b.id);

        // отправляем ответ
        res.status(200).json({
          success: true,
          actions: actions__,
        });

        break;

      case 'POST':
        // Извлекаем данные из тела запроса
        const { actions, userId, teamId } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resActions = await updateActions(
          actionsRepository,
          actions,
          Number(teamId)
        )
        if (!resActions.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resActions.message });
          return;
        }

        const savedActions = resActions.savedActions as ActionTable[];

        const actions_ = savedActions
          .map(action => {
            return {
              id: action.id,
              code: action.code,
              title: action.title,
              interruptible: action.interruptible,
            };
          });

        actions_.sort((a, b) => a.id - b.id);

        // отправляем ответ
        res.status(200).json({
          success: true,
          actions: actions_,
        });
        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (action-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}
export default withAuth(handler)