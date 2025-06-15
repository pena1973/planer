import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getTeamShedule } from './handlers-get';  // расчеты

import { Repository, In } from 'typeorm';
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { TeamScheduleTable } from '@/pages/db/models/plan/team_schedule'

import { UnitItem, ScheduleItem, TimeZoneEnum } from '@/types';

interface RequestBody {
  schedule: ScheduleItem,
  userId:number, 
  teamId:number

}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const teamsRepository = dbConnection.getRepository(TeamTable);

    const teamScheduleRepository = dbConnection.getRepository(TeamScheduleTable);

    // userId, teamId в любом случае
    const { userId: userIdget, teamId: teamIdget } = req.query;

    switch (req.method) {
      case 'GET':
        const shedule_ = await getTeamShedule(Number(teamIdget), teamScheduleRepository)

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
          teamScheduleRepository,
          schedule,
          Number(teamId)
        )
        if (!resSchedule.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resSchedule.message });
          return;
        }

        const savedSchedule = resSchedule.savedSchedule as TeamScheduleTable;

        // отправляем ответ
        res.status(200).json({
          success: true,
          schedule: savedSchedule,
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


// ДЕЙСТВИЯ
async function updateShedule(
  scheduleRepository: Repository<TeamScheduleTable>,
  schedule: ScheduleItem,
  teamId: number
) {

  // Получаем существующее расписание для компании (предполагается, что только одно расписание для компании)
  const existingSchedule = await scheduleRepository.findOne({ where: { team: { id: teamId } } });

  if (!existingSchedule) {
    // Если расписания нет, создаем новое
    const newSchedule = scheduleRepository.create({      
      team: { id: teamId }, // Вместо team_id передаем объект TeamTable
      timeStartWork: schedule.timeStartWork,
      timeFinishWork: schedule.timeFinishWork,
      breaks: schedule.breaks,      
      holidays: schedule.holidays,
      weekends: schedule.weekends,
      workdays: schedule.workdays.map(workday => ({
        date: String(workday.date).split('T')[0], 
        timeStart: workday.timeStart,
        timeFinish: workday.timeFinish
      })),
      timeZone:schedule.timeZone
    });

    const savedNewSchedule = await scheduleRepository.save(newSchedule);
    if (!savedNewSchedule) return { success: false, message: "Не удалось сохранить расписание" };

    return { success: true, savedSchedule: savedNewSchedule };

  } else {
    // Если расписание существует, обновляем его
    existingSchedule.timeStartWork = schedule.timeStartWork;
    existingSchedule.timeFinishWork = schedule.timeFinishWork;
    existingSchedule.breaks = schedule.breaks;
    // existingSchedule.holidays = schedule.holidays.map(date => date.toLocaleDateString('en-CA'));
    existingSchedule.holidays = schedule.holidays.map(date => new Date(date));
    existingSchedule.weekends = schedule.weekends;
    existingSchedule.workdays = schedule.workdays.map(workday => ({
      date: String(workday.date).split('T')[0],
      timeStart: workday.timeStart,
      timeFinish: workday.timeFinish
    }));
    
    existingSchedule.timeZone = schedule.timeZone;


    const savedUpdatedSchedule = await scheduleRepository.save(existingSchedule);
    if (!savedUpdatedSchedule) return { success: false, message: "Не удалось обновить расписание" };

    
    return { success: true, savedSchedule: savedUpdatedSchedule };
  }
}

export default withAuth(handler)