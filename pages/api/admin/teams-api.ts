//pages/api/catalogs/team-api.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from './../../../lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { TeamTable } from './../../../db/models/catalogs/teams'
import { getTeams } from './../../../handlers/handlers-get';

interface RequestBody {
  teamId: number,
  title: string,
  coment: string,
  userId: number
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'GET': //!
        const { userId: userIdget } = req.query;
        const teams = await getTeams(Number(userIdget), locale, teamsRepository)

        teams.sort((a, b) => a.id - b.id);

        res.status(200).json({
          success: true,
          teams: teams,
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
      location: "pages/api/admin/teams-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)