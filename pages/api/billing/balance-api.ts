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
import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { BalanceTable } from '../../../db/models/billing/balance';
import { TeamTable } from './../../../db/models/catalogs/teams'

import { getBalance, getTeamShedule } from '../../../handlers/handlers-get';  // расчеты
import { getCurrentDateInString } from "./../../../lib/common/timezone"


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'


    switch (req.method) {
      case 'GET':

        const { teamId, userId } = req.query;

        // запросим расписание компании чтобы взять timezone
        const shedule = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)

        if (!shedule) { 
          return res.status(200).json({ 
            success: false, 
            balance: 0,             
            message: `${t('mes.noTimezoneForBalance')}` 
          }); }

        const today = getCurrentDateInString(shedule.timeZone);

        const balance_ = await getBalance(Number(userId), locale, today, Number(teamId), balanceRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          balance: balance_,
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
      location: "pages/api/billing/balance-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)