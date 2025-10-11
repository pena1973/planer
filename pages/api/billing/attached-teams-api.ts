//pages/api/units-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from '../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from '../../../db/utilites'
import { generateTeamNumber } from '@/lib/common/utils'
import { TeamTable } from '../../../db/models/catalogs/teams';
import { getTeamsByMainteamNumber } from '../../../handlers/handlers-get';  // расчеты

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);


    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'


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
        res.status(405).json({ error: 'Method not supported.' });
    }
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/billing/attached-teams-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)