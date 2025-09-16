import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../db/utilites'

import { getSettings } from './../../handlers/handlers-get';  
import { updateSettings } from './../../handlers/handlers-update'; 
import { SettingsTable} from './../../db/models/plan/settings'

import { SettingsItem } from './../../types/types';

interface RequestBody {
  userId:number,
  teamId:number,
  settings: SettingsItem
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const settingsRepository = getTypedRepository(db, 'SettingsTable', SettingsTable);

  try {
  
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
export default withAuth(handler)