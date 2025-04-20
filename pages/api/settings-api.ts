import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getSettings } from './handlers-get';  // расчеты

import { Repository, In } from 'typeorm';
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { SettingsTable} from '@/pages/db/models/plan/settings'

import { UnitItem, SettingsItem } from '@/types';

interface RequestBody {
  settings: SettingsItem
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const teamsRepository = dbConnection.getRepository(TeamTable);

    const settingsRepository = dbConnection.getRepository(SettingsTable);

    // userId, teamId в любом случае
    const { userId, teamId } = req.query;

    switch (req.method) {
      case 'GET':
        const settings_ = await getSettings(Number(teamId), settingsRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          schedule: settings_,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { settings } = req.body as RequestBody;
        
        const resSettings = await updateSettings(
          settingsRepository,
          settings,
          Number(teamId)
        )
        if (!resSettings.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resSettings.message });
          return;
        }

        const savedSettings = resSettings.savedSettings as SettingsItem;  //  можно сразу привести типы простые

        // отправляем ответ
        res.status(200).json({
          success: true,
          settings: savedSettings,
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (setting-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}


// 
async function updateSettings(
  settingsRepository: Repository<SettingsTable>,
  settings: SettingsItem,
  teamId: number
) {

  // Получаем существующее расписание для компании (предполагается, что только одно расписание для компании)
  const existingSetting = await settingsRepository.findOne({ where: { team: { id: teamId } } });

  if (!existingSetting) {
    // Если расписания нет, создаем новое
    const newSettings = settingsRepository.create({      
      team: { id: teamId }, // Вместо team_id передаем объект TeamTable
      timeStartWork: settings.timeStartWork,
      timeFinishWork: settings.timeFinishWork,
      showWeekend: settings.showWeekend,      
      showHoliday: settings.showHoliday,      
      isQualControl: settings.isQualControl,
    });

    const savedNewSettings = await settingsRepository.save(newSettings);
    if (!savedNewSettings) return { success: false, message: "Не удалось сохранить расписание" };

    return { success: true, savedSettings: savedNewSettings };

  } else {
    // Если расписание существует, обновляем его
    existingSetting.timeStartWork = settings.timeStartWork;
    existingSetting.timeFinishWork = settings.timeFinishWork;
    existingSetting.showHoliday = settings.showHoliday;
    existingSetting.showWeekend = settings.showWeekend;
    existingSetting.isQualControl = settings.isQualControl;
    const savedUpdatedSchedule = await settingsRepository.save(existingSetting);
    if (!savedUpdatedSchedule) return { success: false, message: "Не удалось обновить расписание" };

    return { success: true, savedSettings: savedUpdatedSchedule };
  }
}

