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
import { changeStateTeambyId } from '../../../handlers/handlers-update';  // расчеты
import { ActiveTimeTable } from '../../../db/models/billing/active_time';
import { TeamTable } from '../../../db/models/catalogs/teams';
import { BalanceTable } from '../../../db/models/billing/balance';
import { TeamScheduleTable } from '../../../db/models/plan/team_schedule';

import { getCurrentDateInDate } from "./../../../lib/common/timezone"

import { getTeamsByMainteamNumber, getBalance, getTeamActivity, getTeamShedule } from '../../../handlers/handlers-get';  // расчеты
import { YYYYMMDD } from '@/lib/common/utils';

interface RequestBody {
  userId: number,
  teamId: number, // основная команда пользователя
  state: boolean,
  teamIdToChange: number,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  try {
    const db = await connectDb();
    const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
    const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
    const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
    const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'GET':

        const { mainTeam: mainTeam, userId: userIdget } = req.query;

        const attachedTeams = await getTeamsByMainteamNumber(Number(userIdget), locale, String(mainTeam), teamsRepository)
        const teamActivity = await getTeamActivity(Number(userIdget), locale, attachedTeams, activeTimeRepository);

        // отправляем ответ
        res.status(200).json({
          success: true,
          teamActivity: teamActivity,
        });

        break;
      // активация/деактивация команды
      case 'POST':
        // Извлекаем данные из тела запроса
        const { teamIdToChange, userId, state, teamId } = req.body as RequestBody;

        // запросим расписание компании чтобы взять timezone
        const shedule = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)

        if (!shedule) {
          res.status(200).json({
            success: false,
            // message: "Ошибка, не найдено расписание команды",
            message: t('mes.sheduleNotFound'),
          });
          break;
        }

        //  проверим прогноз баланс если запрос на активацию
        if (state) {

          // Текущая дата с учетом часового пояса на сервере (надо увязать с пользовательским указанным в настройках)          
          const now = getCurrentDateInDate(shedule.timeZone);

          const balance = await getBalance(Number(userId), now.toLocaleDateString('en-CA'), YYYYMMDD(), Number(teamId), balanceRepository);

          if (!balance) {
            res.status(200).json({
              success: false,

              message: `${'mes.balanse_error'}`
              // message: `Ошибка запроса к базе. 
              // Текущий баланс: неопределен`
            });
            break;
          }

          if (balance <= 0) {
            res.status(200).json({
              success: false,
              message: `${'mes.notEhoughBalance'}: ${balance}`
              // message: `Недостаточно средств на балансе для активации команды. 
              // Текущий баланс: ${balance} ед`
            });
            break;
          }
        }

        // изменение состояния активности команды
        const resTeam = await changeStateTeambyId(Number(userId), locale, activeTimeRepository, Number(teamIdToChange), Boolean(state), shedule.timeZone)
        if (!resTeam.success) {
          res.status(200).json({
            success: false,
            message: resTeam.message
          });

          break;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
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
      location: "pages/api/billing/activity-teams-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)