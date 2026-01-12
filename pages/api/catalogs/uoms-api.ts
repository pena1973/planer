//pages/api/catalogs/uoms-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from './../../../lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { updateUOMS } from './../../../handlers/handlers-update';  // расчеты
import { UOMsTable } from './../../../db/models/catalogs/uoms';
import { UOMItem } from './../../../types/types';
import { getUOMs } from './../../../handlers/handlers-get';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number,
  uoms: UOMItem[];
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {

    const db = await connectDb();
    const uomsRepository = getTypedRepository(db, 'UOMsTable', UOMsTable);
    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); 

    switch (req.method) {
      case 'GET':
        const { teamId: teamIdget, userId: userIdget } = req.query;
        const uomsGet = await getUOMs(Number(userIdget), locale, Number(teamIdget), uomsRepository)

        uomsGet.sort((a, b) => {
          if (a.id === undefined || b.id === undefined) {
            return 0;
          }
          return a.id - b.id; // Сортировка по id
        });

        res.status(200).json({
          success: true,
          uoms: uomsGet,
        });

        break;
      case 'POST':
        const { uoms, userId, teamId } = req.body as RequestBody;

        const resUOMS = await updateUOMS(
          Number(userId), locale,
          uomsRepository,
          uoms,
          Number(teamId)
        )
        if (!resUOMS.success) {
          res.status(200).json({
            success: true,
            message: resUOMS.message,
          });
        }

        const savedUOMs = resUOMS.savedUOMS as UOMsTable[];

        const uomsPost = savedUOMs
          .map(uom => {
            return {
              id: uom.id,
              title: uom.title,
              code: uom.code
            };
          });


        res.status(200).json({
          success: true,
          uoms: uomsPost,
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
      location: "pages/api/catalogs/uoms-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)