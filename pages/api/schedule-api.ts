import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getCompanyShedule } from './handlers';  // расчеты

import { Repository, In } from 'typeorm';
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { CompanyScheduleTable } from '@/pages/db/models/plan/company-schedule'

import { UnitItem, CompanyScheduleItem } from '@/types';

interface RequestBody {
  schedule: CompanyScheduleItem
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(CompanyTable);

    const companyScheduleRepository = dbConnection.getRepository(CompanyScheduleTable);

    // userId, companyId в любом случае
    const { userId, companyId } = req.query;

    switch (req.method) {
      case 'GET':
        const shedule_ = await getCompanyShedule(Number(companyId), companyScheduleRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          schedule: shedule_,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { schedule } = req.body as RequestBody;
        
        const resSchedule = await updateShedule(
          companyScheduleRepository,
          schedule,
          Number(companyId)
        )
        if (!resSchedule.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resSchedule.message });
          return;
        }

        const savedSchedule = resSchedule.savedSchedule as CompanyScheduleTable;

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
    console.error('Ошибка подключения или выполнения запроса:', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}


// ДЕЙСТВИЯ
async function updateShedule(
  scheduleRepository: Repository<CompanyScheduleTable>,
  schedule: CompanyScheduleItem,
  company_id: number
) {

  // Получаем существующее расписание для компании (предполагается, что только одно расписание для компании)
  const existingSchedule = await scheduleRepository.findOne({ where: { company: { id: company_id } } });

  if (!existingSchedule) {
    // Если расписания нет, создаем новое
    const newSchedule = scheduleRepository.create({      
      company: { id: company_id }, // Вместо company_id передаем объект CompanyTable
      timeStartWork: schedule.timeStartWork,
      timeFinishWork: schedule.timeFinishWork,
      breaks: schedule.breaks,      
      holidays: schedule.holidays,
      weekends: schedule.weekends,
      workdays: schedule.workdays.map(workday => ({
        date: String(workday.date).split('T')[0], 
        timeStart: workday.timeStart,
        timeFinish: workday.timeFinish
      }))
    });

    const savedNewSchedule = await scheduleRepository.save(newSchedule);
    if (!savedNewSchedule) return { success: false, message: "Не удалось сохранить расписание" };

    return { success: true, savedSchedule: savedNewSchedule };

  } else {
    // Если расписание существует, обновляем его
    existingSchedule.timeStartWork = schedule.timeStartWork;
    existingSchedule.timeFinishWork = schedule.timeFinishWork;
    existingSchedule.breaks = schedule.breaks;
    // existingSchedule.holidays = schedule.holidays.map(date => date.toISOString().split('T')[0]);
    existingSchedule.holidays = schedule.holidays;
    existingSchedule.weekends = schedule.weekends;
    existingSchedule.workdays = schedule.workdays.map(workday => ({
      date: String(workday.date).split('T')[0],
      timeStart: workday.timeStart,
      timeFinish: workday.timeFinish
    }));

    const savedUpdatedSchedule = await scheduleRepository.save(existingSchedule);
    if (!savedUpdatedSchedule) return { success: false, message: "Не удалось обновить расписание" };

    return { success: true, savedSchedule: savedUpdatedSchedule };
  }
}

