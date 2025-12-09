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
import { updateTeam } from './../../../handlers/handlers-update';

import { TeamItem } from './../../../types/types';

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

      case 'POST':
        // Извлекаем данные из тела запроса
        const { teamId, title, coment, userId } = req.body as RequestBody;

        const resTeam = await updateTeam(userId, locale, teamId, title, coment, teamsRepository);

        if (!resTeam.success) {
          // отправляем ответ
          res.status(200).json({
            success: false,
            message: resTeam.message,
          });
          break;
        }

        const team = resTeam.savedTeam as TeamItem;  //  можно сразу привести типы простые

        // отправляем ответ
        res.status(200).json({
          success: true,
          team: team,
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
      location: "pages/api/catalogs/team-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)