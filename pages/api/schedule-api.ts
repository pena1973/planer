import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/translate/locale';
import { getTypedRepository } from './../../db/utilites'
import { getTeamShedule } from './../../handlers/handlers-get';  // расчеты
import { updateShedule } from './../../handlers/handlers-update';  // расчеты
import { TeamTable } from './../../db/models/catalogs/teams'
import { TeamScheduleTable } from './../../db/models/plan/team_schedule'


import { ScheduleItem, DaysOfWeek, TimeZoneEnum } from './../../types/types';

interface RequestBody {
  schedule: ScheduleItem,
  userId: number,
  teamId: number

}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  // const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

  try {
    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'GET':
        const { userId: userIdget, teamId: teamIdget } = req.query;
        const shedule_ = await getTeamShedule(Number(userIdget), locale, Number(teamIdget), teamScheduleRepository)
        
        if (!shedule_) {
          res.status(200).json({
            success: false,
            message: "Ошибка, не найдено расписание команды",
          });
          break;
        }
        // отправляем ответ
        res.status(200).json({
          success: true,
          schedule: shedule_,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { schedule, userId, teamId } = req.body as RequestBody;

        const resSchedule = await updateShedule(
          Number(userId), locale,
          teamScheduleRepository,
          schedule,
          Number(teamId)
        )
        if (!resSchedule.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resSchedule.message });
          return;
        }

        const savedSchedule = resSchedule.savedSchedule as TeamScheduleTable;
        //  переводим в ScheduleItem

        // // Если team уже есть в сторе — подставь реальный объект:
        // const team = teams.find(t => t.id === savedSchedule.team_id)!; // поменяй на свой источник

        const schedule_: ScheduleItem = {
          teamId: savedSchedule.team_id,
          timeStartWork: savedSchedule.timeStartWork,
          timeFinishWork: savedSchedule.timeFinishWork,
          // breaks: Array.isArray(savedSchedule.breaks) ? savedSchedule.breaks : [],
          breaks: savedSchedule.breaks ?? [],
          // holidays: (savedSchedule.holidays ?? []).map(toYMD),
          holidays: (savedSchedule.holidays ?? []),
          weekends: savedSchedule.weekends ?? [],
          workdays: savedSchedule.workdays ?? [],
          timeZone: savedSchedule.timeZone as TimeZoneEnum,
        };


        // отправляем ответ
        res.status(200).json({
          success: true,
          schedule: schedule_,
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (schedule-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)