import { withAuth } from './../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites'
import { generateTeamNumber } from '@/lib/utils'
import { deactivateTeam } from './../../../handlers/handlers-update';  // расчеты
import { TeamTable } from './../../../db/models/catalogs/teams';
import { TeamItem, UOMItem } from './../../../types/types';
import { getAttachedTeams } from './../../../handlers/handlers-get';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number,
  attachedTeamId: number,
  // mainTeam: string;
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);

  try {

    const { mainTeam: mainTeam } = req.query;
    switch (req.method) {
      case 'GET':
        const attachedTeams = await getAttachedTeams(String(mainTeam), teamsRepository)

        const attachedTeams_ = attachedTeams
          .filter(team => generateTeamNumber(team.prefix, team.id) !== team.main_team)

        // отправляем ответ
        res.status(200).json({
          success: true,
          attachedTeams: attachedTeams_,
        });

        break;
      // деактивация присоединенной команды
      case 'POST':
        // Извлекаем данные из тела запроса
        const { attachedTeamId, userId, teamId } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resTeam = await deactivateTeam(
          teamsRepository,
          Number(attachedTeamId),
        )
        if (!resTeam.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTeam.message });
          return;
        }

        const savedTeam = resTeam.team as TeamTable;

        const team = {
          id: savedTeam.id,
          title: savedTeam.title,
          active: savedTeam.active,
          main_team: savedTeam.main_team,
          prefix: savedTeam.prefix,
          coment: savedTeam.coment,
        } as TeamItem;

        // отправляем ответ
        res.status(200).json({
          success: true,
          attachedTeam: team,
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