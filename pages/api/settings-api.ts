import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getSettings } from './handlers-get';  // расчеты
import { updateSettings } from './handlers-update';  // расчеты

import { SettingsTable} from '@/pages/db/models/plan/settings'

import { UnitItem, SettingsItem } from '@/types';

interface RequestBody {
  userId:number,
  teamId:number,
  settings: SettingsItem
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение    
    const settingsRepository = dbConnection.getRepository(SettingsTable);

    switch (req.method) {
      case 'GET': 
      
        const {teamId:getTeamId } = req.query;
        const settings_ = await getSettings(Number(getTeamId), settingsRepository)
        
        // отправляем ответ
        res.status(200).json({
          success: true,
          schedule: settings_,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { settings, userId, teamId  } = req.body as RequestBody;
        
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
