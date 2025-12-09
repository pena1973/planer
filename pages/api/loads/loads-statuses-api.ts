// pages/api/loads/loads-statuses-api.ts
// API для получения статусов загрузок юнитов (unit loads statuses)
// Используется в настройках команд (TeamSettings) и при создании/редактировании карт (TCardForm)
import { ulogger } from "./../../../lib/common/universal-logger";

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getLoadStatuses} from './../../../handlers/handlers-get';  // расчеты
import { UnitLoadTable } from '../../../db/models/plan/unit_loads';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();

  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);

  try {
    const locale = getLocaleFromHeader(req.headers["x-lang"]);
   
    switch (req.method) {
      case 'GET': 
      const { userId, teamId} = req.query;
        //  получим юниты с загрузкой  до планирования новой карты         
        const unitsLoadStatuses = await getLoadStatuses(Number(userId), locale,  Number(teamId),unitLoadRepository,)
        
        res.status(200).json({
          success: true,
          unitsLoadStatuses: unitsLoadStatuses,          
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
        location: "pages/api/action-api",
        event: "api_error",
        message: `catch: ${error}`,
        context: "",
      }).catch(() => { console.error("logger error") });
      res.status(500).json({ error: `${error}` });
    }
}

export default withAuth(handler)