

import React, { useEffect, useState, useMemo } from 'react';
import styles from "./jobSettings.module.scss";
import ScheduleEditor from "@/components/admin/ScheduleEditor/scheduleEditor";
import { setJobSetting } from '@/services/admin/setJobSetting';
import { getJobSetting } from '@/services/admin/getJobSetting';
import { JobSettingItem } from '@/types/service-types';

import { useTranslation } from 'react-i18next';
const pad2 = (n: number) => String(n).padStart(2, "0");

// HH:mm -> "15:00"
const formatTimeHHmm = (t?: string | null) => {
  if (!t) return "";
  const [hh, mm] = t.split(":");
  if (!hh || !mm) return t;
  return `${pad2(Number(hh))}:${pad2(Number(mm))}`;
};

const formatDateTimeInTz = (iso?: string, timeZone?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  // если timeZone кривой/пустой — упадёт RangeError, подстрахуемся
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      timeZone: timeZone || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  } catch {
    // fallback: локальная зона браузера
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  }
};

// IMPORTANT: подстрой switch под твои реальные значения JobScheduleType
const scheduleToText = (job: JobSettingItem) => {
  const tz = job.timezone ? ` (${job.timezone})` : "";

  switch (job.schedule_type) {
    case "daily": {
      const t = formatTimeHHmm(job.daily_time) || "00:00";
      return `Ежедневно в ${t}${tz}`;
    }

    case "hourly": {
      const m =
        job.hourly_minute == null ? "00" : pad2(Math.max(0, Math.min(59, job.hourly_minute)));
      return `Каждый час в :${m}${tz}`;
    }

    case "every_x_minutes": {
      const n = job.every_minutes ?? 0;
      return n > 0 ? `Каждые ${n} мин.${tz}` : `Каждые N мин.${tz}`;
    }

    case "monthly": {
      if (job.monthly_end_of_month) return `Ежемесячно в последний день${tz}`;
      if (job.monthly_day != null) return `Ежемесячно ${job.monthly_day}-го числа${tz}`;
      return `Ежемесячно${tz}`;
    }

    default:
      return `—${tz}`;
  }
};



interface JobSettingsProps {
  setMessage: (message: string) => void,
  userId: number,
  token: string,
}

export const JobSettings: React.FC<JobSettingsProps> = ({
  setMessage,
  userId,
  token,

}) => {

  const { t, i18n } = useTranslation();
  const [jobsValue, setJobsValue] = useState<JobSettingItem[]>([]);


  const setJobSettinghandler = async (jobSetting: JobSettingItem) => {
    await setJobSetting(userId, jobSetting, token, t, i18n.language, setMessage, setJobsValue);

  };
  const getJobSettinghandler = async () => {
    await getJobSetting(userId, token, t, i18n.language, setMessage, setJobsValue);
  };

  useEffect(() => {
    getJobSettinghandler();
  }, []);



  const jobsReactNodes = jobsValue.map((job, index) => {
    return (
      <tr key={job.job_key ?? index}>
        <td>{job.job_key}</td>

        {/* Активно: галочка/крестик */}
        <td style={{ textAlign: "center" }} title={job.enabled ? "Активно" : "Отключено"}>
          {job.enabled ? "✅" : "—"}
          {/* если хочешь строго "Да/Нет": {job.enabled ? "Да" : "Нет"} */}
        </td>

        {/* Расписание: словесно */}
        <td>{scheduleToText(job)}</td>

        {/* Последний/Следующий: в timezone задания */}
        <td>{formatDateTimeInTz(job.last_run_at, job.timezone)}</td>
        <td>{formatDateTimeInTz(job.next_run_at, job.timezone)}</td>
      </tr>
    );
  });

  // const jobsReactNodes = jobsValue.map((job, index) => {
  //   const schedule = "раз в день в 15-00";
  //   return (
  //     <tr key={index}>
  //       <td>{job.job_key}</td>
  //       <td>{job.enabled}</td>
  //       {/* <td>{job.timezone}</td> */}
  //       <td>{schedule}</td>  {/* // описание периодичности запуска задания */}
  //       <td>{job.next_run_at}</td>
  //       <td>{job.last_run_at}</td>
  //     </tr>
  //   );
  // });

  return (

    <React.Fragment>
      <ScheduleEditor
        token={token}
        userId={userId}
        setMessage={setMessage}
        onSubmit={setJobSettinghandler} />

      Список рег заданий с ключами:
      <ol>
        <li>списание баланса — <span>billing:charge</span></li>
        <li>очистка 90 дней — <span>cleanup:core</span></li>
      </ol>
      Состояния рег заданий
      {/* таблица */}
      <table className={styles._table}>
        <thead>
          <tr>
            <th>{t('jobs.job_key')}</th>
            <th>{t('jobs.enabled')}</th>
            <th>{t('jobs.schedule')}</th>
            <th>{t('jobs.next_run_at')}</th>
            <th>{t('jobs.last_run_at')}</th>
          </tr>
        </thead>
        <tbody>{jobsReactNodes}
        </tbody>
      </table>
    </React.Fragment>
  );
};
