//pages/api/billing/usage-api.ts
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
import { generateUniqueIdc} from "@/lib/common/utils"
import { updateBalance } from './../../../handlers/handlers-update';
import { getUsage, getTeamShedule } from '../../../handlers/handlers-get';  // расчеты

import { getCurrentDateInString } from "./../../../lib/common/timezone"

interface RequestBody {
  userId: number,
  teamId: number,
  date: string,
  amount: number,
  direction: string,
  coment: string,
}


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  // const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'


    switch (req.method) {
      case 'GET':

        const { teamId: teamIdget, userId: userIdget } = req.query;

        // // запросим расписание компании чтобы взять timezone
        // const shedule = await getTeamShedule(Number(userIdget), locale, Number(teamIdget), teamScheduleRepository)

        // if (!shedule) {
        //   return res.status(200).json({
        //     success: false,
        //     balance: 0,
        //     message: `${t('mes.noTimezoneForBalance')}`
        //   });
        // }

        // const today = getCurrentDateInString(shedule.timeZone);

        const usage_ = await getUsage(Number(userIdget), locale,  Number(teamIdget), balanceRepository)
        // отправляем ответ
        res.status(200).json({
          success: true,
          usage: usage_,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { userId, teamId, date, amount, direction, coment } = req.body as RequestBody;


        // проводка пополнения  баланса  при создании новой независимой команды в режиме триал
        if (teamId) {
          const balanceRes = await updateBalance(
            Number(userId),
            locale,
            balanceRepository,
            Number(teamId),
            String(generateUniqueIdc()),
            amount,
            date,
            false,
            true,
            'gift - ' + date,
            direction,
            coment)
        }
        const usage = await getUsage(Number(userId), locale, Number(teamId), balanceRepository)
        // отправляем ответ
        res.status(200).json({
          success: true,
          usage: usage,
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
      location: "pages/api/billing/usage-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)