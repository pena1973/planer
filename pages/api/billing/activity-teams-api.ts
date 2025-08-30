import { withAuth } from '../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getTypedRepository } from '../../../db/utilites'
import { changeStateTeambyId } from '../../../handlers/handlers-update';  // расчеты
import { ActiveTimeTable } from '../../../db/models/billing/active_time';
import { TeamTable } from '../../../db/models/catalogs/teams';
import { BalanceTable } from '../../../db/models/billing/balance';
import { MainTable } from '../../../db/models/billing/main';
import { TeamItem } from '../../../types/types';

import { getTeamsByMainteamNumber, getBalance, getForecast, getTeamActivity } from '../../../handlers/handlers-get';  // расчеты

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
  const mainRepository = getTypedRepository(db, 'MainTable', MainTable);

  try {

    const { mainTeam: mainTeam } = req.query;
    switch (req.method) {
      case 'GET':
        const attachedTeams = await getTeamsByMainteamNumber(String(mainTeam), teamsRepository)
        const teamActivity = await getTeamActivity(attachedTeams, activeTimeRepository);
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

        //  проверим прогноз баланс если запрос на активацию
        if (state) {

          // Текущая дата с учетом часового пояса на сервере (надо увязать с пользовательским указанным в настройках)
          const now = new Date();

          // Год и месяц (месяц нужно +1, потому что getMonth() возвращает 0–11)
          const year_ = now.getFullYear();
          const month_ = now.getMonth() + 1;

          const balance = await getBalance(Number(teamId), balanceRepository);

          const forecast = await getForecast(Number(teamId), year_, month_, teamsRepository, activeTimeRepository, mainRepository,);
          if (balance < forecast) {
            res.status(200).json({
              success: false,
              message: `Недостаточно средств на балансе для активации команды. 
              Текущий баланс: ${balance} у.е., прогнозируемые расходы на текущий месяц: ${forecast} у.е.`
            });
            return;
          }

        }

        // изменение состояния активности команды
        const resTeam = await changeStateTeambyId(activeTimeRepository, Number(teamIdToChange), Boolean(state))
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