import { withAuth } from '../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/translate/locale';
import { getTypedRepository } from '../../../db/utilites'
import { changeStateTeambyId } from '../../../handlers/handlers-update';  // расчеты
import { ActiveTimeTable } from '../../../db/models/billing/active_time';
import { TeamTable } from '../../../db/models/catalogs/teams';
import { BalanceTable } from '../../../db/models/billing/balance';
import { TeamScheduleTable } from '../../../db/models/plan/team_schedule';

import { getCurrentDateInDate} from "./../../../lib/common/timezone"

import { getTeamsByMainteamNumber, getBalance, getTeamActivity, getTeamShedule } from '../../../handlers/handlers-get';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number, // основная команда пользователя
  state: boolean,
  teamIdToChange: number,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'GET':  
        
      const { mainTeam: mainTeam, userId: userIdget} = req.query;

        const attachedTeams = await getTeamsByMainteamNumber(Number(userIdget),locale, String(mainTeam), teamsRepository)
        const teamActivity = await getTeamActivity(Number(userIdget),locale,attachedTeams, activeTimeRepository);

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
        const shedule_ = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)
          
        if (!shedule_) {
          res.status(200).json({
            success: false,
            message: "Ошибка, не найдено расписание команды",
          });
          break;
        }

        //  проверим прогноз баланс если запрос на активацию
        if (state) {

          // Текущая дата с учетом часового пояса на сервере (надо увязать с пользовательским указанным в настройках)
          // const now = new Date();
          const now = getCurrentDateInDate(shedule_.timeZone);

          const balance = await getBalance(Number(userId),  now.toLocaleDateString('en-CA'), Number(teamId), balanceRepository);

          if (balance <= 0) {
            res.status(200).json({
              success: false,
              message: `Недостаточно средств на балансе для активации команды. 
              Текущий баланс: ${balance} ед`
            });
            return;
          }
        }

        // изменение состояния активности команды
        const resTeam = await changeStateTeambyId(Number(userId), locale, activeTimeRepository, Number(teamIdToChange), Boolean(state), shedule_.timeZone)
        if (!resTeam.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTeam.message });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
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