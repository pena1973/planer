import { withAuth } from '../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getTypedRepository } from '../../../db/utilites'
import { generateTeamNumber } from '@/lib/utils'
import { ActiveTimeTable } from '../../../db/models/billing/active_time';
import { TeamTable } from '../../../db/models/catalogs/teams';
import { getAttachedTeams } from '../../../handlers/handlers-get';  // расчеты

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
     
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (uoms-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)