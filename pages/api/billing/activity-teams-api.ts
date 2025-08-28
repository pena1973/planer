import { withAuth } from '../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getTypedRepository } from '../../../db/utilites'
import { changeStateTeambyId } from '../../../handlers/handlers-update';  // расчеты
import { ActiveTimeTable } from '../../../db/models/billing/active_time';
import { TeamTable } from '../../../db/models/catalogs/teams';
import { TeamItem } from '../../../types/types';

import { getAttachedTeams, getTeamActivity } from '../../../handlers/handlers-get';  // расчеты

interface RequestBody {
  userId: number,
  state: boolean,
  teamIdToChange: number,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);

  try {

    const { mainTeam: mainTeam } = req.query;
    switch (req.method) {
      case 'GET':
        const attachedTeams = await getAttachedTeams(String(mainTeam), teamsRepository)
        const teamActivity = await getTeamActivity(attachedTeams, activeTimeRepository);
        // отправляем ответ
        res.status(200).json({
          success: true,
          teamActivity: teamActivity,
        });

        break;
      // активация/деактивация присоединенной команды
      case 'POST':
        // Извлекаем данные из тела запроса
        const { teamIdToChange, userId, state } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resTeam = await changeStateTeambyId(activeTimeRepository, Number(teamIdToChange), Boolean(state))
        if (!resTeam.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTeam.message });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
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