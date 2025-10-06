/// проверяет баланс у команд и деактивирует если баланса недостаточно  - запускается раз в день
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/server/withAuth";

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from '../../../db/utilites'
import { JobSettingsTable } from './../../../db/models/job/job-settings';
import { updateJobSetting } from './../../../handlers/handlers-update';
import { JobSettingItem, JobScheduleType } from "@/types/service-types";

// ⬇️ добавили
import { computeNextRun } from '@/job/computeNextRun';

interface RequestBody {
  jobSetting: JobSettingItem;
  userId: number;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const jobSettingsRepository = getTypedRepository(db, 'JobSettingsTable', JobSettingsTable);

  try {
    
    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'POST': {
        const { jobSetting, userId } = req.body as RequestBody;

        // 1) Сохраняем/обновляем настройки
        const resJobSetting = await updateJobSetting(Number(userId), locale, jobSettingsRepository, jobSetting);
        if (!resJobSetting.success || !resJobSetting.savedJobSetting) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + (resJobSetting.message ?? '') });
          return;
        }

        const saved = resJobSetting.savedJobSetting as JobSettingsTable;

        // 2) Инициализируем/пересчитываем next_run_at сразу после сохранения
        const now = new Date();
        const nextRun = saved.enabled ? computeNextRun(saved, now) : null;

        // если next_run_at изменился — обновим в БД
        // (можно обновлять всегда, это дешевле, чем сравнивать даты)
        await jobSettingsRepository.update({ id: saved.id }, { next_run_at: nextRun });
        saved.next_run_at = nextRun ?? null; // синхронизируем объект для ответа

        // 3) Готовим ответ
        const jobSetting_: JobSettingItem = {
          job_key: saved.job_key,
          enabled: saved.enabled,
          timezone: saved.timezone,
          schedule_type: saved.schedule_type as JobScheduleType,
          monthly_day: saved.monthly_day,
          monthly_end_of_month: saved.monthly_end_of_month,
          daily_time: saved.daily_time,
          hourly_minute: saved.hourly_minute,
          every_minutes: saved.every_minutes,
          // если в твоём типе JobSettingItem есть это поле — верни его,
          // если нет — можно просто добавить отдельным полем в ответ:
          // next_run_at: saved.next_run_at ?? undefined,
        };

        res.status(200).json({
          success: true,
          jobSetting: jobSetting_,
          next_run_at: saved.next_run_at, // удобно видеть в UI
        });
        break;
      }

      default:
        res.status(405).end();
    }
  } catch (error) {
    console.error('Ошибка в create-bills (job-settings save):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler);
