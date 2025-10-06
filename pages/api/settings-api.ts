//pages/api/settings-api.ts
// API для получения и обновления настроек (settings)
// Используется в настройках команд (TeamSettings)
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'

import { getSettings } from './../../handlers/handlers-get';
import { updateSettings } from './../../handlers/handlers-update';
import { SettingsTable } from './../../db/models/plan/settings'

import { SettingsItem } from './../../types/types';

interface RequestBody {
  userId: number,
  teamId: number,
  settings: SettingsItem
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const settingsRepository = getTypedRepository(db, 'SettingsTable', SettingsTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'
    switch (req.method) {
      // получение настроек команды
      case 'GET':
        const { teamId: teamIdget, userId: userIdget } = req.query;

        const settingsGet = await getSettings(Number(userIdget), locale, Number(teamIdget), settingsRepository)

        if (!settingsGet) {
          res.status(200).json({
            success: false,
            // message: 'Не удалось получить настройки.',
            message: t('mes.settingsNotFound'),
          });
          break;
        }
        // отправляем ответ
        res.status(200).json({
          success: true,
          schedule: settingsGet,
        });

        break;
      // обновление настроек команды
      case 'POST':
        // Извлекаем данные из тела запроса
        const { settings, userId, teamId } = req.body as RequestBody;

        const resSettings = await updateSettings(
          Number(userId),
          locale,
          settingsRepository,
          settings,
          Number(teamId)
        )
        if (!resSettings.success) {

          res.status(200).json({
            success: false,
            message: `${t('mes.settingsNotSaved')}  + ${resSettings.message}`
          });
          break;
        }
        //  можно сразу привести все типы простые
        const savedSettings = resSettings.savedSettings as SettingsItem;

        // отправляем ответ
        res.status(200).json({
          success: true,
          settings: savedSettings,
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
      location: "pages/api/settings-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}
export default withAuth(handler)