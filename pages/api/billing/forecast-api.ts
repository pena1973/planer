import { withAuth } from '../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '../../../db/database';
import { TeamTable } from "../../../db/models/catalogs/teams";
import { ActiveTimeTable } from "../../../db/models/billing/active_time";
import { MainTable } from "../../../db/models/billing/main";
import { calcMonthlyTeamCosts } from "../../../handlers/calcMonthlyTeamCosts";
import { getTeam, } from '../../../handlers/handlers-auth';
import { getTypedRepository } from '../../../db/utilites';
import { getTeamsByMainteamNumber, getForecast } from '../../../handlers/handlers-get';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
  const mainRepository = getTypedRepository(db, 'MainTable', MainTable);

  try {
    const { teamId, month, year } = req.query;

    const forecast = await getForecast(Number(teamId), Number(year), Number(month), teamsRepository, activeTimeRepository, mainRepository,);

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

