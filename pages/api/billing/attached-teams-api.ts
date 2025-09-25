import { withAuth } from '../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/translate/locale';
import { getTypedRepository } from '../../../db/utilites'
import { generateTeamNumber } from '@/lib/common/utils'
import { TeamTable } from '../../../db/models/catalogs/teams';
import { getTeamsByMainteamNumber } from '../../../handlers/handlers-get';  // расчеты

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  try {
 
    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    
    switch (req.method) {
      case 'GET':
        const { mainTeam: mainTeam, userId: userIdget } = req.query;

        const attachedTeams = await getTeamsByMainteamNumber(Number(userIdget), locale, String(mainTeam), teamsRepository)

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