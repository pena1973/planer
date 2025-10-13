//pages/api/schedule-api.ts
// API для получения и обновления расписания команды (schedule)
// Используется в настройках команды (TeamSettings) для изменения рабочего времени, выходных и праздников
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'
import { getTeamShedule } from './../../handlers/handlers-get';
import { updateShedule } from './../../handlers/handlers-update';
import { TeamScheduleTable } from './../../db/models/plan/team_schedule'

import { ScheduleItem, TimeZoneEnum } from './../../types/types';

interface RequestBody {
  schedule: ScheduleItem,
  userId: number,
  teamId: number

}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {

    const db = await connectDb();
    const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'


    switch (req.method) {
      // получение расписания команды
      case 'GET':
        const { userId: userIdget, teamId: teamIdget } = req.query;

        const shedule = await getTeamShedule(Number(userIdget), locale, Number(teamIdget), teamScheduleRepository)

        if (!shedule) {
          res.status(200).json({
            success: false,
            // message: "Ошибка, не найдено расписание команды",
            message: t('mes.sheduleNotFound'),
          });
          break;
        }
        // отправляем ответ
        res.status(200).json({
          success: true,
          schedule: shedule,
        });

        break;
      // обновление расписания команды
      case 'POST':

        const { schedule, userId, teamId } = req.body as RequestBody;

        const resSchedule = await updateShedule(
          Number(userId), locale,
          teamScheduleRepository,
          schedule,
          Number(teamId)
        )
        if (!resSchedule.success) {
          res.status(200).json({
            success: false,
            message: `${t('mes.sheduleNotSaved')}  + ${resSchedule.message}`
          });
          break;
        }

        const savedSchedule = resSchedule.savedSchedule as TeamScheduleTable;

        //  переводим в ScheduleItem        
        const schedule_: ScheduleItem = {
          teamId: savedSchedule.team_id,
          timeStartWork: savedSchedule.timeStartWork,
          timeFinishWork: savedSchedule.timeFinishWork,
          breaks: savedSchedule.breaks ?? [],
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
      location: "pages/api/schedule-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)