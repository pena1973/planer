import { withAuth } from '../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/translate/locale';
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

    switch (req.method) {
      case 'GET':

        const { teamId, userId } = req.query;

        // запросим расписание компании чтобы взять timezone
        const shedule_ = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)
        
        if (!shedule_) { return res.status(200).json({ success: false, balance: 0, message: "Для получения баланса необходимо знать таймзону команды, она не указана" }); }

        const today = getCurrentDateInString(shedule_.timeZone);
       
        const balance_ = await getBalance(Number(userId),  today, Number(teamId), balanceRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          balance: balance_,
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