// pages/api/unit-exceptions-api.ts
// API для получения исключений по юнитам (unit exceptions)
// Используется в настройках команд (TeamSettings) и при создании/редактировании карт (TCardForm)
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';
import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';

import { getTypedRepository } from './../../db/utilites'
import { getUnitExceptions } from './../../handlers/handlers-get';  // расчеты
import { UnitExceptionTable } from './../../db/models/plan/unit_exceptions'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  
  try {
    
    const db = await connectDb();

    const unitExceptionsRepository = getTypedRepository(db, 'UnitExceptionTable', UnitExceptionTable);


    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    const t = getServerT(locale, 'translation');

    switch (req.method) {
      case 'GET':

        const { userId, teamId, unitId } = req.query;

        const exceptions = await getUnitExceptions(Number(userId), locale, Number(teamId), unitExceptionsRepository, Number(unitId))

        exceptions.sort((a, b) => {
          if (a.date === undefined || b.date === undefined) {
            return 0;
          }

          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        // отправляем ответ
        res.status(200).json({
          success: true,
          exceptions: exceptions,
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
      location: "pages/api/unit-exceptions-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)