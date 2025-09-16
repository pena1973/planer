import { JobSettingsTable } from './../db/models/job/job-settings';

export function computeNextRun(s: JobSettingsTable, nowDate: Date): Date | null {
  const now = new Date(nowDate.getTime());
  now.setSeconds(0, 0); // округляем до минуты

  switch (s.schedule_type) {
    case 'monthly': {
      const targetDay = s.monthly_end_of_month
        ? lastDayOfMonth(now)
        : Math.max(1, Math.min(31, s.monthly_day || 1));

      let cand = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        targetDay,
        0, 0, 0, 0
      ));

      if (cand <= now) {
        const nextMonth = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          1, 0, 0, 0, 0
        ));
        const nextDay = s.monthly_end_of_month ? lastDayOfMonth(nextMonth) : targetDay;
        cand = new Date(Date.UTC(
          nextMonth.getUTCFullYear(),
          nextMonth.getUTCMonth(),
          nextDay,
          0, 0, 0, 0
        ));
      }
      return cand;
    }

    case 'daily': {
      const [hh, mm] = (s.daily_time || '03:00').split(':').map(n => parseInt(n, 10));
      let cand = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        hh || 0, mm || 0, 0, 0
      ));

      if (cand <= now) {
        cand.setUTCDate(cand.getUTCDate() + 1);
      }
      return cand;
    }

    case 'hourly': {
      const m = s.hourly_minute ?? 0;
      let cand = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        m, 0, 0
      ));

      if (cand <= now) {
        cand.setUTCHours(cand.getUTCHours() + 1);
      }
      return cand;
    }

    case 'every_x_minutes': {
      const step = Math.max(1, s.every_minutes || 1);
      const minutes = now.getUTCMinutes();
      const mod = minutes % step;
      const add = mod === 0 ? step : (step - mod);
      const cand = new Date(now.getTime());
      cand.setUTCMinutes(minutes + add, 0, 0);
      return cand;
    }

    default:
      return null;
  }
}

// хелпер: последний день месяца
function lastDayOfMonth(date: Date): number {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}
