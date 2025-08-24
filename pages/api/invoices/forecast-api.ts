import { withAuth } from './../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../../db/database';
import { TeamTable } from "./../../../db/models/catalogs/teams";
import { ActiveTimeTable } from "./../../../db/models/billing/active_time";
import { MainTable } from "./../../../db/models/billing/main";
import { calcMonthlyTeamCosts } from "./../../../handlers/calcMonthlyTeamCosts";
import { getTeam, } from './../../../handlers/handlers-auth';
import { getTypedRepository } from './../../../db/utilites';
import { getAttachedTeams } from './../../../handlers/handlers-get';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
  const mainRepository = getTypedRepository(db, 'MainTable', MainTable);
  try {
    const { teamId, month, year } = req.query;
    const teamId_ = Number(teamId);
    const month_ = Number(month);
    const year_ = Number(year);

    // 1) Берём выбранную команду
    const resTeam = await getTeam(Number(teamId), teamsRepository)

    if (!resTeam.success || !resTeam.team) {
      res.status(500).json({ error: 'Не удалось обработать запрос. ' + resTeam.message });
      return;
    }

    const team = resTeam.team;

    // 2) Определяем «код» главной группы
    //    - у подчинённой в main_team уже лежит код главной
    //    - у главной там её собственный код
    let groupCode = team.main_team;

    // 3) Получаем id всех активных команд этой группы (включая главную)
    const teams = await getAttachedTeams(String(groupCode), teamsRepository)
    // let teamIds = teams.map(team => team.id);
    // teamIds.push(teamId_); // добавим главную


    // 4) Считаем прогноз по всем активным командам, с учетом возможного фильтра
    const allCosts = await calcMonthlyTeamCosts(teams, teamsRepository, activeTimeRepository,mainRepository, year_, month_);
    const forecast = +allCosts.reduce((acc, r) => acc + (r.cost ?? 0), 0).toFixed(2);

    return res.status(200).json({
      success: true,
      forecast: forecast,
    });
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (forecast-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });

  }
}

export default withAuth(handler)

