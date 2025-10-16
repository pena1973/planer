
import { ulogger } from "./../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';
import { Repository, In, Not } from 'typeorm';
// tables
import { UnitTable } from './../db/models/catalogs/units'
import { UnitActionTable } from './../db/models/catalogs/unit_actions'
import { UnitLoadTable } from './../db/models/plan/unit_loads';
import { TCardTable } from './../db/models/data/t_cards'
import { TCardStageTable } from './../db/models/data/t_card_stages'
import { TemplateTable } from './../db/models/catalogs/templates'

import { ProductTable } from './../db/models/data/products'
import { TCardProductTable } from './../db/models/data/t_card_products'
import { TCardOperationTable } from './../db/models/data/t_card_operations'
import { TypeEnum } from './../types/types';
import { ActionTable } from './../db/models/catalogs/actions';
import { UOMsTable } from './../db/models/catalogs/uoms';
import { UnitExceptionTable } from './../db/models/plan/unit_exceptions';
import { SettingsTable } from './../db/models/plan/settings';
import { TeamTable } from './../db/models/catalogs/teams';
import { TeamScheduleTable } from './../db/models/plan/team_schedule'
import { UserTable } from './../db/models/catalogs/users';
import { UserUnitTable } from './../db/models/catalogs/user_unit';
import { MailTable } from './../db/models/support/mails';

import { ClientTable } from './../db/models/billing/clients';
import { ActiveTimeTable } from "./../db/models/billing/active_time";

import { BalanceTable } from "./../db/models/billing/balance";
import { JobSettingsTable } from "./../db/models/job/job-settings";

import { BanerTable } from './../db/models/support/baners';

// types
import {
  UnitItem, UserItem, UnitLoadItem, UnitActionItem, UnitExceptionItem,
  SupportMailItem, TCardItem, TCardOperationItem, TCardProductItem,
  ProductItem, UserUnitItem, TCardStageItem, ActionItem, UOMItem,
  SettingsItem, TemplateItem, StatusEnum, UnitBelongEnum, UnitTypeEnum,
  ScheduleItem, TeamItem
} from './../types/types';

import { ClientItem, JobSettingItem, BanerItem } from './../types/service-types';


import { YYYYMMDD } from "@/lib/common/utils"
import { getCurrentDateInString, } from "../lib/common/timezone"

// Создание c строки баланса
export async function updateBalance(
  userId: number | null,
  locale: string,
  balanceRepository: Repository<BalanceTable>,
  teamId: number,
  transactionId: string,
  amount: number,
  date: string,
  is_trial: boolean,
  document: string,
  direction: string,
  coment: string,
) {

  // Получаем существующую транзакцию расписание для компании (предполагается, что только одно расписание для компании)
  const existingBalance = await balanceRepository.findOne({ where: { team_id: teamId, date: date, transaction_id: transactionId } });

  if (!existingBalance) {
    // Если транзакции нет, создаем новую
    const newBalance = balanceRepository.create({

      team_id: teamId,
      date: date,
      summa: amount,
      direction: direction,
      document: document,
      coment: coment,
      is_trial: is_trial,
      transaction_id: transactionId
    });
    const savedNewBalance = await balanceRepository.save(newBalance);
    if (!savedNewBalance) return { success: false, message: "Не удалось сохранить транзакцию " + document };

    return { success: true, savedNewBalance: savedNewBalance };

  } else {
    // Если транзакция существует, обновляем ее
    existingBalance.team_id = teamId;
    existingBalance.date = date;
    existingBalance.summa = amount;
    existingBalance.direction = direction;
    existingBalance.document = document;
    existingBalance.coment = coment;
    existingBalance.is_trial = is_trial;
    existingBalance.transaction_id = transactionId;

    const savedUpdatedBalance = await balanceRepository.save(existingBalance);
    if (!savedUpdatedBalance) return { success: false, message: "Не удалось обновить баланс" };
  }
  return {
    success: true, savedSettings: []

  };
}

// Установка настройки рег задания
export async function updateJobSetting(
  userId: number,
  locale: string,
  jobSettingRepository: Repository<JobSettingsTable>,
  jobSetting: JobSettingItem,
) {

  // Получаем существующую транзакцию расписание для компании (предполагается, что только одно расписание для компании)
  const existingJobSetting = await jobSettingRepository.findOne({ where: { job_key: jobSetting.job_key } });

  let savedJobSetting = {} as JobSettingsTable;

  if (!existingJobSetting) {
    // Если настроек нет, создаем новую
    const newJobSetting = jobSettingRepository.create({
      job_key: jobSetting.job_key,
      enabled: jobSetting.enabled,
      timezone: jobSetting.timezone,
      schedule_type: jobSetting.schedule_type,
      monthly_day: jobSetting.monthly_day,
      monthly_end_of_month: jobSetting.monthly_end_of_month,
      daily_time: jobSetting.daily_time,
      hourly_minute: jobSetting.hourly_minute,
      every_minutes: jobSetting.every_minutes,
    });
    savedJobSetting = await jobSettingRepository.save(newJobSetting);
    if (!savedJobSetting) return { success: false, message: "Не удалось сохранить настройку рег задания " + jobSetting.job_key };

  } else {
    // Если транзакция существует, обновляем ее    
    existingJobSetting.enabled = jobSetting.enabled;
    existingJobSetting.timezone = jobSetting.timezone;
    existingJobSetting.schedule_type = jobSetting.schedule_type;
    existingJobSetting.monthly_day = jobSetting.monthly_day ?? null;
    existingJobSetting.monthly_end_of_month = jobSetting.monthly_end_of_month ?? false;
    existingJobSetting.daily_time = jobSetting.daily_time ?? null;
    existingJobSetting.hourly_minute = jobSetting.hourly_minute ?? null;
    existingJobSetting.every_minutes = jobSetting.every_minutes ?? null;

    savedJobSetting = await jobSettingRepository.save(existingJobSetting);
    if (!savedJobSetting) return { success: false, message: "Не удалось сохранить настройку рег задания " + jobSetting.job_key };
  }
  return { success: true, savedJobSetting: savedJobSetting };

}

// Состояние активности нескольких команд
export async function changeStateTeamsByIds(
  userId: number | null,
  locale: string,
  activeTimeRepository: Repository<ActiveTimeTable>,
  teamIds: number[],
  state: boolean,
  day?: string, // yyyy-mm-dd
): Promise<{ success: boolean; message?: string; failed?: number[] }> {
  if (!teamIds || teamIds.length === 0) {
    return { success: false, message: "Список команд пуст." };
  }

  const failed: number[] = [];

  // const dateStr = (!day) ? new Date().toLocaleDateString('en-CA') : day;
  const dateStr = (!day) ? YYYYMMDD() : day;

  try {
    for (const id of teamIds) {
      if (!Number.isFinite(id)) {
        failed.push(id);
        continue;
      }

      try {
        const activityTime = activeTimeRepository.create({
          date: dateStr,
          direction: state ? 'start' : "finish",
          team_id: id,
        });

        const saved = await activeTimeRepository.save(activityTime);
        if (!saved?.id) {
          failed.push(id);
        }
      } catch (e) {
        console.error(`Ошибка при обновлении состояния для команды ${id}:`, e);
        failed.push(id);
      }
    }

    if (failed.length > 0) {
      return { success: false, message: "Некоторые команды не удалось обновить", failed };
    }

    return { success: true };
  } catch (err) {
    console.error("changeStateTeamsByIds error:", err);
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

// Состояние активности команды
export async function changeStateTeambyId(
  userId: number,
  locale: string,
  activeTimeRepository: Repository<ActiveTimeTable>,
  teamId: number,
  state: boolean,
  timezone: string,
): Promise<{ success: boolean; message?: string; team?: TeamTable }> {

  if (!Number.isFinite(teamId)) {
    return { success: false, message: "Команда не указана." };
  }
  const todayStr = getCurrentDateInString(timezone);
  try {
    const activityTime = activeTimeRepository.create({
      // date: new Date().toLocaleDateString('en-CA'),
      date: todayStr,
      direction: state ? 'start' : "finish",
      team_id: teamId
    });
    // 2) первый save -> сработает @BeforeInsert и заполнит prefix
    const savedActivityTime = await activeTimeRepository.save(activityTime);

    if (!savedActivityTime?.id) {
      return { success: false, message: "Не удалось изменить состояние активности команды." };
    }
    return { success: true };

  } catch (err) {
    console.error("changeStateTeambyId error:", err);
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

//! НАСТРОЙКИ
export async function updateSettings(
  userId: number,
  locale: string,
  settingsRepository: Repository<SettingsTable>,
  settings: SettingsItem,
  teamId: number
) {
  const t = getServerT(locale, 'sermes');

  try {
    // Получаем существующее настройки для компании (предполагается, что только одни настройки для компании)
    const existingSetting = await settingsRepository.findOne({ where: { team_id: teamId } });

    if (!existingSetting) {
      // Если настроек нет, создаем новые
      const newSettings = settingsRepository.create({
        team_id: teamId,
        timeStartWork: settings.timeStartWork,
        timeFinishWork: settings.timeFinishWork,
        showWeekend: settings.showWeekend,
        showHoliday: settings.showHoliday,
        isQualControl: settings.isQualControl,
      });

      const savedNewSettings = await settingsRepository.save(newSettings);
      return { success: true, savedSettings: savedNewSettings };

    } else {
      // Если расписание существует, обновляем его
      existingSetting.timeStartWork = settings.timeStartWork;
      existingSetting.timeFinishWork = settings.timeFinishWork;
      existingSetting.showHoliday = settings.showHoliday;
      existingSetting.showWeekend = settings.showWeekend;
      existingSetting.isQualControl = settings.isQualControl;
      const savedUpdatedSettings = await settingsRepository.save(existingSetting);
      return { success: true, savedSettings: savedUpdatedSettings };
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateSettings",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateSettings",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! ШАБЛОНЫ
export async function updateTemplates(
  userId: number,
  locale: string,
  templatesRepository: Repository<TemplateTable>,
  templates: TemplateItem[],
  teamId: number
) {
  const t = getServerT(locale, 'sermes');

  try {
    // // СПИСОК ДЕЙСТВИЙ в базе
    const existingTemplates = await templatesRepository.find({ where: { team_id: teamId } });

    // 1. Найдём удалённые шаблоны
    const templatesToDelete = existingTemplates.filter(template =>
      !templates.some(newTemplate => newTemplate.id === template.id) // Сравниваем id существующих стадий с переданными
    );

    // 2. Найдём новые единицы измерения, которых нет в базе
    const templatesToAdd = templates.filter(template =>
      !existingTemplates.some(existingTemplates => existingTemplates.id === template.id) // Сравниваем id переданных стадий с существующими
    );

    // 3. Найдём существующие единицы измерения для обновления
    const templatesToUpdate = templates.filter(template =>
      existingTemplates.some(existingTemplates => existingTemplates.id === template.id) // Сравниваем id для существующих стадий
    );

    // Удаляем старые единицы измерения
    if (templatesToDelete.length > 0) {
      await templatesRepository.remove(templatesToDelete);
    }

    // Добавляем новые единицы измерения
    const newTemplates = templatesToAdd.map(template => {
      return templatesRepository.create({
        fileContent: template.fileContent,
        name: template.name,
        team_id: teamId,
      });
    });

    const savedNewTemplates = await templatesRepository.save(newTemplates);

    // Обновляем существующие единицы измерения
    const updatedTemplates = templatesToUpdate.map(template => {
      const existingTemplate = existingTemplates.find(existingTemplate => existingTemplate.id === template.id);
      if (existingTemplate) {
        existingTemplate.name = template.name;
        existingTemplate.fileContent = template.fileContent;
        return templatesRepository.create(existingTemplate);
      }
      return null;
    }).filter(template => template !== null);

    const savedUpdatedTemplates = await templatesRepository.save(updatedTemplates);

    const savedTemplates = [...savedNewTemplates, ...savedUpdatedTemplates] as TemplateTable[]

    return { success: true, savedTemplates: savedTemplates, message: "" }
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateTemplates",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateTemplates",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

// КЛИЕНТ
export async function updateClient(
  userId: number,
  locale: string,
  clientRepository: Repository<ClientTable>,
  client: ClientItem,
  teamId: number
): Promise<{ success: boolean; message?: string; savedClient?: ClientTable }> {

  if (!Number.isFinite(teamId)) {
    return { success: false, message: "Команда не указана." };
  }

  try {
    // 1) Ищем по team_id — у команды один клиент
    const existingClient = await clientRepository.findOne({ where: { team_id: teamId } });

    // 2) Если есть — обновляем поля
    if (existingClient) {
      existingClient.title = client.title?.trim() ?? existingClient.title;
      existingClient.reg_n = client.reg_n?.trim() ?? existingClient.reg_n;
      existingClient.address_line1 = client.address_line1?.trim() ?? existingClient.address_line1;
      existingClient.address_line2 = client.address_line2?.trim() ?? existingClient.address_line2;
      existingClient.city = client.city?.trim() ?? existingClient.city;
      existingClient.postal_code = client.postal_code?.trim() ?? existingClient.postal_code;

      existingClient.email = client.email?.trim() ?? existingClient.email;
      existingClient.phone = client.phone?.trim() ?? existingClient.phone;
      existingClient.country = client.country?.trim() ?? existingClient.country;
      existingClient.customer_id = client.customerId?.trim() ?? existingClient.customer_id;

      const saved = await clientRepository.save(existingClient);
      if (!saved?.id) {
        return { success: false, message: "Не удалось сохранить реквизиты клиента (update)." };
      }
      return { success: true, savedClient: saved };
    }

    // 3) Если нет — создаём новую запись (upsert)
    const toCreate = clientRepository.create({
      title: client.title?.trim() ?? "",
      reg_n: client.reg_n?.trim() ?? "",
      address_line1: client.address_line1?.trim() ?? "",
      address_line2: client.address_line2?.trim() ?? "",
      city: client.city?.trim() ?? "",
      postal_code: client.postal_code?.trim() ?? "",
      email: client.email?.trim() ?? "",
      phone: client.phone?.trim() ?? "",
      team_id: teamId,
      country: client.country?.trim() ?? "",
      customer_id: client.customerId?.trim() ?? "",

    });

    const saved = await clientRepository.save(toCreate);
    if (!saved?.id) {
      return { success: false, message: "Не удалось сохранить реквизиты клиента (create)." };
    }
    return { success: true, savedClient: saved };

  } catch (err) {
    console.error("updateClient error:", err);
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

//! ЕДИНИЦЫ ИЗМЕРЕНИЯ
export async function updateUOMS(
  userId: number,
  locale: string,
  uomsRepository: Repository<UOMsTable>,
  uoms: UOMItem[],
  teamId: number
) {
  const t = getServerT(locale, 'sermes');

  try {
    const existingUOMS = await uomsRepository.find({ where: { team_id: teamId } });

    // 1. Найдём удалённые единицы измерения
    const uomsToDelete = existingUOMS.filter(uom =>
      !uoms.some(newUOM => newUOM.id === uom.id) // Сравниваем id существующих стадий с переданными
    );

    // 2. Найдём новые единицы измерения, которых нет в базе
    const uomsToAdd = uoms.filter(uom =>
      !existingUOMS.some(existingUOMS => existingUOMS.id === uom.id) // Сравниваем id переданных стадий с существующими
    );

    // 3. Найдём существующие единицы измерения для обновления
    const uomsToUpdate = uoms.filter(uom =>
      existingUOMS.some(existingUOMS => existingUOMS.id === uom.id) // Сравниваем id для существующих стадий
    );

    // Удаляем старые единицы измерения
    if (uomsToDelete.length > 0) {
      await uomsRepository.remove(uomsToDelete);
    }

    // Добавляем новые единицы измерения
    const newUOMS = uomsToAdd.map(uom => {
      return uomsRepository.create({
        code: uom.code,
        title: uom.title,
        team_id: teamId,
      });
    });

    const savedNewUOMS = await uomsRepository.save(newUOMS);

    // Обновляем существующие единицы измерения
    const updatedUOMS = uomsToUpdate.map(uom => {
      const existingUOM = existingUOMS.find(existingUOM => existingUOM.id === uom.id);
      if (existingUOM) {
        existingUOM.title = uom.title;
        existingUOM.code = uom.code;
        return existingUOM;
      }
      return null;
    }).filter(unitAction => unitAction !== null);

    const savedUpdatedUOMS = await uomsRepository.save(updatedUOMS);
    const savedUOMS = [...savedNewUOMS, ...savedUpdatedUOMS] as UOMsTable[]

    return { success: true, savedUOMS: savedUOMS }
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateUOMS",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateUOMS",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! ДЕЙСТВИЯ
export async function updateActions(
  userId: number,
  locale: string,
  actionsRepository: Repository<ActionTable>,
  actions: ActionItem[],
  teamId: number,
) {
  const t = getServerT(locale, 'sermes');

  try {
    // Что есть в БД по команде
    const existingActions = await actionsRepository.find({ where: { team_id: teamId } });

    // Быстрые структуры по id
    const existingIds = new Set(existingActions.map(a => Number(a.id)));
    const incomingIds = new Set(actions.map(a => Number(a.id)));
    const byId = new Map(existingActions.map(a => [Number(a.id), a]));

    // 1) На удаление: есть в БД, нет во входящих
    const actionToDelete = existingActions.filter(a => !incomingIds.has(Number(a.id)));

    // 2) На добавление: есть во входящих, нет в БД
    const actionToAdd = actions.filter(a => !existingIds.has(Number(a.id)));

    // 3) На обновление: есть и там, и там
    const actionToUpdate = actions.filter(a => existingIds.has(Number(a.id)));

    let savedNewActions: ActionTable[] = [];
    let savedUpdatedActions: ActionTable[] = [];

    // Короткая транзакция — всё или ничего
    await actionsRepository.manager.transaction(async (m) => {

      const repo = m.withRepository(actionsRepository);

      if (actionToDelete.length > 0) {
        await repo.remove(actionToDelete);
      }

      if (actionToAdd.length > 0) {
        const newActionEntities = actionToAdd.map(a =>
          repo.create({
            code: a.code,
            title: a.title,
            interruptible: a.interruptible,
            team_id: teamId,
          })
        );
        savedNewActions = await repo.save(newActionEntities, { chunk: 500 });
      }

      if (actionToUpdate.length > 0) {
        const updatedEntities = actionToUpdate
          .map(a => {
            const ex = byId.get(Number(a.id));
            if (!ex) return null;
            ex.code = a.code;
            ex.title = a.title;
            ex.interruptible = a.interruptible;
            return ex;
          })
          .filter((x): x is ActionTable => x !== null);

        if (updatedEntities.length > 0) {
          savedUpdatedActions = await repo.save(updatedEntities, { chunk: 500 });
        }
      }
    });

    const savedActions = [...savedNewActions, ...savedUpdatedActions];
    return { success: true, savedActions };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateActions",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateActions",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! РАСПИСАНИЕ
export async function updateShedule(
  userId: number,
  locale: string,
  scheduleRepository: Repository<TeamScheduleTable>,
  schedule: ScheduleItem,
  teamId: number
) {
  const t = getServerT(locale, 'sermes');

  if (!schedule.teamId) return { success: false, message: t('mes.teamNotFound') };

  try {
    // Получаем существующее расписание для компании (предполагается, что только одно расписание для компании)
    const existingSchedule = await scheduleRepository.findOne({ where: { team_id: teamId }, });

    if (!existingSchedule) {
      // Если расписания нет, создаем новое
      const newSchedule = scheduleRepository.create({
        team_id: teamId,
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
        timeZone: schedule.timeZone
      });

      const savedNewSchedule = await scheduleRepository.save(newSchedule);

      return { success: true, savedSchedule: savedNewSchedule };

    } else {
      // Если расписание существует, обновляем его
      existingSchedule.timeStartWork = schedule.timeStartWork;
      existingSchedule.timeFinishWork = schedule.timeFinishWork;
      existingSchedule.breaks = schedule.breaks;
      existingSchedule.holidays = schedule.holidays;
      existingSchedule.weekends = schedule.weekends;
      existingSchedule.workdays = schedule.workdays.map(workday => ({
        date: String(workday.date).split('T')[0],
        timeStart: workday.timeStart,
        timeFinish: workday.timeFinish
      }));
      existingSchedule.timeZone = schedule.timeZone;

      const savedUpdatedSchedule = await scheduleRepository.save(existingSchedule);
      return { success: true, savedSchedule: savedUpdatedSchedule };
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateShedule",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateShedule",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }

}

//! КОМАНДА
export async function updateTeam(
  userId: number,
  locale: string,
  teamId: number,
  title: string,
  coment: string,
  teamsRepository: Repository<TeamTable>,
): Promise<{ success: boolean, savedTeam?: TeamItem, message?: string }> {
  const t = getServerT(locale, 'sermes');
  try {

    const team = await teamsRepository.findOne({ where: { id: teamId } });

    if (!team) {
      return {
        success: false,
        message: t('mes.teamNotFound'),
      };
    }

    // Обновляем поля команды
    team.title = title;
    team.coment = coment;

    // Сохраняем обновленную команду в базе данных
    const savedTeam = await teamsRepository.save(team);

    return {
      success: true,
      savedTeam: {
        id: savedTeam.id,
        title: savedTeam.title,
        coment: savedTeam.coment,
        prefix: savedTeam.prefix,
        main_team: savedTeam.main_team,
      },
      message: t('mes.teamUpdated'),
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateTeam",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateTeam",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}


//!ЮНИТЫ
export async function updateUnits(
  userId: number,
  locale: string,
  unitRepository: Repository<UnitTable>,
  units: UnitItem[],
  teamId: number
): Promise<{ success: boolean, savedUnits?: UnitItem[], message?: string }> {
  const t = getServerT(locale, 'sermes');
  try {

    // Получаем все существующие юниты в базе
    const existingUnits = await unitRepository.find({ where: { team_id: teamId } });

    // 1. Найдём юниты, которые нужно удалить
    const unitsToDelete = existingUnits.filter(existingUnit =>
      !units.some(unit => unit.id === existingUnit.id) // Сравниваем id существующих юнитов с переданными
    );

    // 2. Найдём юниты, которые нужно добавить
    const unitsToAdd = units.filter(unit =>
      !existingUnits.some(existingUnit => existingUnit.id === unit.id) // Сравниваем id переданных юнитов с существующими
    );

    // 3. Найдём юниты, которые нужно обновить
    const unitsToUpdate = units.filter(unit =>
      existingUnits.some(existingUnit => existingUnit.id === unit.id) // Сравниваем id для существующих юнитов
    );

    // Удаляем старые юниты
    if (unitsToDelete.length > 0) {
      await unitRepository.remove(unitsToDelete);
    }

    // Добавляем новые юниты
    const newUnits = unitsToAdd.map(unit => {
      return unitRepository.create({
        code: unit.code,
        title: unit.title,
        team_id: teamId,
        retool: unit.retool,
        coment: unit.coment,
        belong: unit.belong,
        type: unit.type,
        idc: unit.idc
      });
    });

    const savedNewUnits = await unitRepository.save(newUnits);

    // Обновляем существующие юниты
    const updatedUnits = unitsToUpdate.map(unit => {
      const existingUnit = existingUnits.find(existingUnit => existingUnit.id === unit.id);
      if (existingUnit) {
        existingUnit.title = unit.title;
        existingUnit.code = unit.code;
        existingUnit.retool = unit.retool;
        existingUnit.coment = unit.coment;
        existingUnit.belong = unit.belong;
        existingUnit.type = unit.type;
        return existingUnit;
      }
      return null;
    }).filter(unit => unit !== null);

    const savedUpdatedUnits = await unitRepository.save(updatedUnits);

    const savedUnits = [...savedNewUnits, ...savedUpdatedUnits] as UnitTable[];

    const savedUnits_ = savedUnits.map(u => {
      return {
        id: u.id,
        idc: u.idc,
        title: u.title,
        code: u.code,
        retool: u.retool,
        modified: false,
        belong: u.belong as UnitBelongEnum,
        type: u.type as UnitTypeEnum,
        coment: u.coment,
        active: u.active,
      } as UnitItem
    })
    return { success: true, savedUnits: savedUnits_ };
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateTeam",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateTeam",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! ДЕЙСТВИЯ ЮНИТА
export async function updateUnitActions(
  userId: number,
  locale: string,
  unitActionsRepository: Repository<UnitActionTable>,
  unitActions: UnitActionItem[],
  teamId: number
): Promise<{ success: boolean; message?: string; savedUnitActions?: UnitActionItem[] }> {

  const t = getServerT(locale, 'sermes');

  try {
    const existing = await unitActionsRepository.find({ where: { team_id: teamId } });

    // Быстрые структуры по id
    const existingIds = new Set(existing.map(e => e.id));
    const incomingWithId = unitActions.filter(u => u.id != null) as Array<UnitActionItem & { id: number }>;
    const incomingIds = new Set(incomingWithId.map(u => u.id));

    // 1) На удаление: есть в БД, нет во входящих
    const toDelete = existing.filter(e => !incomingIds.has(e.id));
    await unitActionsRepository.remove(toDelete); // remove([]) безопасен

    // 2) На добавление: нет id или такого id нет в БД
    const toAdd = unitActions.filter(u => u.id == null || !existingIds.has(u.id as number));
    const newEntities = toAdd.map(u =>
      unitActionsRepository.create({
        idc: u.idc,
        koef: u.koef,
        action_id: u.action.id,  // предполагаем, что id валиден
        unit_id: u.unitId,
        unit_idc: u.unitIdc,
        team_id: teamId,
      })
    );
    const savedNew = await unitActionsRepository.save(newEntities); // save([]) => []

    // 3) На обновление: есть id и он в БД
    const toUpdate = unitActions.filter(u => u.id != null && existingIds.has(u.id as number));
    const updatedEntities: UnitActionTable[] = toUpdate.map(u => ({
      id: u.id as number,
      idc: u.idc,
      koef: u.koef,
      action_id: u.action.id,
      unit_id: u.unitId,
      unit_idc: u.unitIdc,
      team_id: teamId,
    } as UnitActionTable)); // достаточно partial с id

    const savedUpdated = await unitActionsRepository.save(updatedEntities);

    // Формируем итог (подтягиваем action из входного списка по idc)
    const byIdcIncoming = new Map(unitActions.map(u => [u.idc, u.action]));
    const savedUnitActions = [...savedNew, ...savedUpdated].map(uas => ({
      id: uas.id,
      idc: uas.idc,
      action: byIdcIncoming.get(uas.idc) ?? ({} as ActionItem),
      koef: uas.koef,
      unitId: uas.unit_id,
      unitIdc: uas.unit_idc,
    })) as UnitActionItem[];

    return { success: true, savedUnitActions };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateUnitActions",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateUnitActions",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! ОТКЛОНЕНИЯ ОТ РАСПИСАНИЯ ЮНИТА
export async function updateExceptions(
  userId: number,
  locale: string,
  unitExceptionsRepository: Repository<UnitExceptionTable>,
  unitExceptions: UnitExceptionItem[],
  teamId: number
): Promise<{ success: boolean; message?: string; savedUnitExceptions?: UnitExceptionItem[] }> {

  const t = getServerT(locale, 'sermes');
  try {
    // СПИСОК ЮНИТОВ в базе
    const existingUnitExceptions = await unitExceptionsRepository.find({ where: { team_id: teamId } });

    // 1. Найдём удалённые  отклонения Юнита
    const unitExceptionsToDelete = existingUnitExceptions.filter(unitException =>
      !unitExceptions.some(newUnitExceptions => newUnitExceptions.id === unitException.id)
    );

    // 2. Найдём новые отклонения Юнита, которых нет в базе
    const unitExceptionsToAdd = unitExceptions.filter(unitException =>
      !existingUnitExceptions.some(existingUnitException => existingUnitException.id === unitException.id)
    );

    // 3. Найдём существующие отклонения Юнита для обновления
    const unitExceptionToUpdate = unitExceptions.filter(unitException =>
      existingUnitExceptions.some(existingUnitException => existingUnitException.id === unitException.id)
    );

    // Удаляем старые отклонения Юнита
    if (unitExceptionsToDelete.length > 0) {
      await unitExceptionsRepository.remove(unitExceptionsToDelete);
    }

    // Добавляем новые действия Юнита
    const newUnitException = unitExceptionsToAdd.map(unitException => {
      return unitExceptionsRepository.create({
        idc: unitException.idc,
        date: unitException.date,
        type: unitException.type,
        timeStart: unitException.timeStart,
        timeFinish: unitException.timeFinish,
        unit_id: unitException.unitId,
        unit_idc: unitException.unitIdc,
        team_id: teamId,
      });
    });

    const savedNewUnitExceptions = await unitExceptionsRepository.save(newUnitException);

    // Обновляем существующие исключения
    const updatedUnitExceptions = unitExceptionToUpdate.map(unitException => {
      const existingUnitException = existingUnitExceptions.find(existingUnitException => existingUnitException.id === unitException.id);
      if (existingUnitException) {
        existingUnitException.date = YYYYMMDD(unitException.date);
        existingUnitException.timeFinish = unitException.timeFinish;
        existingUnitException.timeStart = unitException.timeStart;
        existingUnitException.type = unitException.type;
        return existingUnitException;
      }
      return null;
    }).filter(unitException => unitException !== null);


    const savedUpdatedUnitExceptions = await unitExceptionsRepository.save(updatedUnitExceptions);

    const savedUnitExceptions = [...savedNewUnitExceptions, ...savedUpdatedUnitExceptions] as UnitExceptionTable[]

    const savedUnitExceptions_ = savedUnitExceptions.map(sue => {
      return {
        id: sue.id,
        idc: sue.idc,
        date: YYYYMMDD(sue.date),
        type: sue.type,
        timeStart: sue.timeStart,
        timeFinish: sue.timeFinish,
        unitId: sue.unit_id,
        unitIdc: sue.unit_idc,
      } as UnitExceptionItem
    })
    return { success: true, savedUnitExceptions: savedUnitExceptions_ }
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateExceptions",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateExceptions",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

// НАЗНАЧЕНИЯ ЮНИТА ПОЛЬЗОВАТЕЛЮ
export async function updateUsersUnits(
  userId: number,
  locale: string,
  usersUnitsRepository: Repository<UserUnitTable>,
  users_units: UserUnitItem[],  // Новый массив юнитов для пользователей
  teamId: number
): Promise<{ success: boolean; message?: string; savedUsersUnits?: UserUnitItem[] }> {
  // Получаем все существующие назначения юнитов в базе
  const existingUsersUnits = await usersUnitsRepository.find({
    where: { team_id: teamId },
    // relations: ['user', 'unit']
  });

  // 1. Найдём назначения юнитов, которые нужно удалить
  const usersUnitsToDelete = existingUsersUnits.filter(existingUserUnit =>
    !users_units.some(userUnit => userUnit.id === existingUserUnit.id)  // Сравниваем по id
  );

  // 2. Найдём назначения юнитов, которые нужно добавить
  const usersUnitsToAdd = users_units.filter(userUnit =>
    !existingUsersUnits.some(existingUserUnit => existingUserUnit.id === userUnit.id)  // Сравниваем по id
  );

  // 3. Найдём назначения юнитов, которые нужно обновить
  const usersUnitsToUpdate = users_units.filter(userUnit =>
    existingUsersUnits.some(existingUserUnit => existingUserUnit.id === userUnit.id)  // Сравниваем по id
  );

  // Удаляем старые назначения юнитов
  if (usersUnitsToDelete.length > 0) {
    await usersUnitsRepository.remove(usersUnitsToDelete);
  }

  // Добавляем новые назначения юнитов
  const newUsersUnits = usersUnitsToAdd.map(userUnit => {
    return usersUnitsRepository.create({
      user_id: userUnit.userId,        // Обязательно указываем user_id
      team_id: teamId,                 // Обязательно указываем team_id
      unit_id: userUnit.unit ? userUnit.unit.id : null,  // Если unit существует, указываем его id, если нет - null
      active: userUnit.active,
    });
  });

  let savedNewUsersUnits = [] as UserUnitTable[];
  if (newUsersUnits.length > 0) savedNewUsersUnits = await usersUnitsRepository.save(newUsersUnits);
  if (!savedNewUsersUnits) return { success: false, message: "Не удалось сохранить новые назначения юнитов" };

  // Обновляем существующие назначения юнитов
  const updatedUsersUnits = usersUnitsToUpdate.map(userUnit => {
    const existingUserUnit = existingUsersUnits.find(existingUserUnit => existingUserUnit.id === userUnit.id);

    if (existingUserUnit) {

      if (userUnit.unit?.id) {
        return {
          id: userUnit.id,
          unit_id: userUnit.unit.id,
          active: userUnit.active,
        }
      }
      else {
        return {
          id: userUnit.id,
          unit_id: null,
          active: userUnit.active,
        }
      }
      // Возвращаем обновленный объект
    } else
      return null;  // Возвращаем null, если соответствующая запись не найдена

  }).filter(userUnit => userUnit !== null);  // Отфильтровываем null значения

  // Сохраняем обновленные записи в базе данных
  let savedUpdatedUsersUnits = [] as UserUnitTable[];
  if (updatedUsersUnits.length > 0) savedUpdatedUsersUnits = await usersUnitsRepository.save(updatedUsersUnits);
  if (!savedUpdatedUsersUnits) return { success: false, message: "Не удалось обновить назначения юнитов" };
  //  получаем полные записи UserUnitTable для обновленных назначений

  // Получаем полные записи UserUnitTable для обновленных назначений
  savedUpdatedUsersUnits = await usersUnitsRepository.find({
    where: { id: In(savedUpdatedUsersUnits.map(unit => unit.id)) }, // Получаем только обновленные записи
    // relations: ['unit', 'user'], // Загружаем связь с таблицей UnitTable
  });

  // Все назначения юнитов сохранены, проверка
  let error = "";
  const savedUsersUnits = [...savedNewUsersUnits, ...savedUpdatedUsersUnits] as UserUnitTable[];

  // Проверка, что количество назначений совпадает
  if (savedUsersUnits.length > 0 && users_units.length !== savedUsersUnits.length) {
    error = `Не удалось сохранить назначения юнитов`;
    console.log(error);
    return { success: false, message: error };
  }

  // Проверка, что все объекты имеют сгенерированный id
  if (savedUsersUnits.length > 0) {
    savedUsersUnits.forEach((userUnit, index) => {
      if (userUnit.id) {
        console.log(`Назначение юнита ${index + 1} успешно сохранено с id: ${userUnit.id}`);
      } else {
        error = `Ошибка при сохранении назначения юнита ${index + 1}`;
        console.log(error);
        return { success: false, message: error };
      }
    });
  } else {
    error = `Не удалось сохранить назначения юнитов`;
    console.log(error);
    return { success: false, message: error };
  }
  const savedUsersUnits_ = savedUsersUnits.map(uusaved => {
    const unit = users_units.find(uu => (uu.unit && uu.unit?.id === uusaved.unit_id))?.unit;
    const uu = users_units.find(uu => (uu.userId === uusaved.user_id));
    return {
      id: uusaved.id,
      userId: uusaved.user_id,
      name: uu?.name,
      unit: unit ?? null,
      active: uusaved.active

    } as UserUnitItem
  })
  return { success: true, savedUsersUnits: savedUsersUnits_ };
}

// Пользователи  снимаю отметку активности
export async function updateUsers(
  userId: number,
  locale: string,
  usersRepository: Repository<UserTable>,
  users: UserItem[],
  teamId: number
) {

  // СПИСОК ДЕЙСТВИЙ в базе
  const existingUsers = await usersRepository.find({ where: { team_id: teamId } });

  // 3. Найдём существующие  для обновления
  const usersToUpdate = users.filter(user =>
    existingUsers.some(existingUsers => existingUsers.id === user.id) // Сравниваем id для существующих стадий
  );


  // Обновляем существующие 
  const updatedUsers = usersToUpdate.map(user => {
    const existingUser = existingUsers.find(existingUser => existingUser.id === user.id);
    if (existingUser) {
      existingUser.active = user.active === true; // Обновляем нужные поля

      return usersRepository.create(existingUser);
    }
    return null;
  }).filter(user => user !== null);

  let savedUpdatedUsers = [] as UserTable[]
  if (updatedUsers.length > 0) savedUpdatedUsers = await usersRepository.save(updatedUsers);
  if (!savedUpdatedUsers) return { success: false, message: "Не удалось сохранить юзеров " }

  // Все единицы измерения сохранены, проверка
  let error = ""

  // вход и выход массив единицы измерения не совпадает количество записей - чтото не сохранилось
  if (savedUpdatedUsers.length > 0 && users.length !== savedUpdatedUsers.length) {
    error = `Не удалось сохранить единицы измерения`;
    console.log(error);
    return { success: false, message: error }
  }

  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedUpdatedUsers.length > 0 && users.length > 0) {
    if (savedUpdatedUsers.length > 0) {

      savedUpdatedUsers.forEach((user, index) => {
        if (user.id) {
          console.log(`Единица измерения успешно сохранена с id: ${user.id}`);
        } else {
          error = `Ошибка при сохранении единицы измерения ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить единицы измерени`;
      console.log(error);
      return { success: false, message: error }
    }
  }
  return { success: true, savedUsers: savedUpdatedUsers }
}

//! Обновление лоадов карты
export async function updateTCardLoads(
  userId: number,
  locale: string,
  teamId: number,
  tCardId: number,
  loads: UnitLoadItem[],
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean, loads?: UnitLoadTable[], message: string }> {

  const t = getServerT(locale, 'sermes');

  try {

    const existingLoads = await unitLoadRepository.find({ where: { id_tCard: tCardId } });

    // 1. Найдём удалённые лоады
    const loadsToDelete = existingLoads.filter(load =>
      !loads.some(newLoad => newLoad.id === load.id) // Сравниваем id существующих лоадов
    );

    // 2. Найдём новые лоады, которых нет в базе
    const loadsToAdd = loads.filter(load =>
      !existingLoads.some(existingLoads => existingLoads.id === load.id) // Сравниваем id переданных стадий с существующими
    );

    // 3. Найдём существующие лоады для обновления
    const loadsToUpdate = loads.filter(load =>
      existingLoads.some(existingLoads => existingLoads.id === load.id) // Сравниваем id для существующих стадий
    );

    // Удаляем лоады которые надо удалить
    if (loadsToDelete.length > 0) {
      await unitLoadRepository.remove(loadsToDelete);
    }

    // Добавляем новые единицы лоады  -  операция нереальная! добавлено для совместимости с остальными функциями    
    const newLoads = loadsToAdd.map(load => {
      return unitLoadRepository.create({
        date: load.date,
        idc: load.idc,
        id_oper: load.id_oper,
        idc_oper: load.idc_oper, // Идентификатор операции  
        id_tCard: load.id_tCard, // Идентификатор тех карты
        timeStart: Math.ceil(load.timeStart), // Время начала в минутах окр в большую сторону
        timeFinish: Math.ceil(load.timeFinish), // Время окончания в минутах окр в большую сторону
        team_id: teamId,
        unit_id: load.unit.id,
        status: load.status,
        isActive: load.isActive,
        isRetool: load.isRetool,
        isPinned: load.isPinned,
        isOuterStart: load.isOuterStart,
        isOuterFinish: load.isOuterFinish,
        version: load.version,
        isFirst: load.isFirst,
      });
    });

    let savedNewLoads = await unitLoadRepository.save(newLoads);

    // // Обновляем существующие лоады (только статус)
    const updatedLoads = loadsToUpdate.map(load => {
      const existingLoad = existingLoads.find(existingLoad => existingLoad.id === load.id);
      if (existingLoad) {
        existingLoad.status = load.status
        return unitLoadRepository.create(existingLoad);
      }
      return null;
    }).filter(load => load !== null);

    let savedUpdatedLoads = await unitLoadRepository.save(updatedLoads);

    const savedLoads = [...savedNewLoads, ...savedUpdatedLoads] as UnitLoadTable[]

    return { success: true, loads: savedLoads as UnitLoadTable[], message: "" }
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateTCardLoads",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateTCardLoads",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! Запись новых лоадов карты
export async function saveNewLoads(
  userId: number,
  locale: string,
  unitLoadRepository: Repository<UnitLoadTable>,
  loadsToAdd: UnitLoadItem[],
  teamId: number
): Promise<{ success: boolean, savedUnitLoads?: UnitLoadItem[], message?: string }> {

  const t = getServerT(locale, 'sermes');

  try {
    // Нет новых загрузок
    if (loadsToAdd.length === 0) {
      return {
        success: true,
        savedUnitLoads: [] as UnitLoadItem[],
      }
    }

    // Добавляем новые Загрузки и меняем статус
    const newLoads = loadsToAdd.map(load => {
      return unitLoadRepository.create({
        date: load.date,
        idc: load.idc,
        id_oper: load.id_oper,
        idc_oper: load.idc_oper,
        id_tCard: load.id_tCard,
        timeStart: Math.ceil(load.timeStart), // Время начала в минутах окр в большую сторону
        timeFinish: Math.ceil(load.timeFinish), // Время окончания в минутах окр в большую сторону
        team_id: teamId,
        unit_id: load.unit.id,
        status: StatusEnum.planed,
        isActive: load.isActive,
        isRetool: load.isRetool,
        isPinned: load.isPinned,
        isOuterStart: load.isOuterStart,
        isOuterFinish: load.isOuterFinish,
        version: load.version,
        isFirst: load.isFirst,
      });
    });

    let savedNewLoads = [] as UnitLoadTable[]
    if (newLoads.length > 0) savedNewLoads = await unitLoadRepository.save(newLoads);

    const savedUnitLoads = savedNewLoads.map(loadT => {
      const load = loadsToAdd.find(lo => lo.id_oper === loadT.id_oper && lo.idc === loadT.idc)
      return {
        id: loadT.id,
        idc: loadT.idc,
        unit: (load) ? load.unit as UnitItem : {} as UnitItem,
        date: String(loadT.date), //   перевели в строковый формат
        idc_oper: loadT.idc_oper,
        id_oper: loadT.id_oper,
        id_tCard: loadT.id_tCard,
        timeStart: loadT.timeStart,
        timeFinish: loadT.timeFinish,
        status: loadT.status,
        isActive: loadT.isActive,
        isRetool: loadT.isRetool,
        loadInfo: (load) ? load.loadInfo : undefined,
        isPinned: loadT.isPinned,//  перенесен вручшую на шкале
        isOuterStart: loadT.isOuterStart,//  это старт оутсортера
        isOuterFinish: loadT.isOuterFinish,
        version: loadT.version,
        isFirst: loadT.isFirst,
      } as UnitLoadItem
    })

    return {
      success: true,
      savedUnitLoads: savedUnitLoads
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/saveNewLoads",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "saveNewLoads",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

///////////////////// КАРТА ТЕХНОЛОГИЧЕСКИХ ОПЕРАЦИЙ//////////////////
//! получаю максимальный номер карты  !!!доделать сброс в предкелах года
// не беру id потому что он в пределах таблицы
async function generateNewNumberForTeam(
  tCardRepository: Repository<TCardTable>,
  teamId: number
) {

  const result = await tCardRepository
    .createQueryBuilder("tCard")
    .select("MAX(CAST(tCard.idc AS int))", "maxNumber")
    .where({ team_id: teamId })
    .getRawOne();

  // Если результат не null, возвращаем максимальное значение, иначе 
  const maxNumber = result?.maxNumber || 0;

  // console.log(maxNumber);

  // Шаг 3: Генерируем новый номер
  const newNumber = maxNumber + 1;

  return newNumber;
}

///////////////////// ЗАПИСЬ КАРТЫ//////////////////
//! ТКАРТА  //  ПРОВЕРИТЬ ПРИ ЗАПИСИ ПРАВИЛЬНОСТЬ СТАТУСА (если есть БРАК!!
export async function updateCard(
  userId: number,
  locale: string,
  tCardRepository: Repository<TCardTable>,
  tCard: TCardItem,
  teamId: number
): Promise<{ success: boolean; savedTCard?: TCardItem; message?: string }> {

  const t = getServerT(locale, 'sermes');

  try {
    let savedTCard: TCardTable | null = null;
    // Генерируем номер карты, если idc = 0
    let newCardNumber = Number(tCard.idc);
    if (tCard.idc === 0) {
      newCardNumber = await generateNewNumberForTeam(tCardRepository, teamId);
      if (!newCardNumber) {
        return {
          success: false,
          // message: `Ошибка при генерации номера карты` 
          message: t("mes.numCardGenerationError"),
        };
      }
    }
    // проверка если есть брак и нет исправления то у карты статус брак  
    // (если она приходит со статусом брак, планирован, подготовлен и драфт)
    const opDefective = tCard.tCardOperations?.filter(op => op.status === StatusEnum.defective);

    const hasUnfixedDefect = opDefective?.some(op => {
      const fix = tCard.tCardOperations?.find(op1 => op1.fixOperIdc === op.idc);
      return !fix; // true, если исправления нет
    });

    if (hasUnfixedDefect &&
      (tCard.status === StatusEnum.draft
        || tCard.status === StatusEnum.planed
        || tCard.status === StatusEnum.prepared)) {
      tCard.status = StatusEnum.defective;
    }

    // Если id карты > 0, обновляем, иначе создаём новую
    if (tCard.id && tCard.id > 0) {
      savedTCard = await tCardRepository.save({
        ...tCard,
        user_id: Number(userId),
        team_id: Number(teamId),
        max_idc: tCard.maxIdc,
        coment: tCard.coment,
        status: tCard.status,
      });
    } else {
      const newTCard = tCardRepository.create({
        user_id: Number(userId),
        date: tCard.date,
        team_id: Number(teamId),
        idc: newCardNumber,
        max_idc: tCard.maxIdc,
        coment: tCard.coment,
        status: tCard.status,
      });
      savedTCard = await tCardRepository.save(newTCard);
    }

    // Формируем TCardItem
    const savedItem: TCardItem = {
      id: savedTCard.id,
      // date: new Date(savedTCard.date).toLocaleDateString("en-CA"),
      date: savedTCard.date,
      idc: savedTCard.idc,
      modified: false,
      maxIdc: savedTCard.max_idc,
      coment: savedTCard.coment,
      status: savedTCard.status
    };

    return { success: true, savedTCard: savedItem };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateCard",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateCard",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}


//! СТАДИИ
export async function updateStages(
  userId: number,
  locale: string,
  tCardStagesRepository: Repository<TCardStageTable>,
  tCardStages: TCardStageItem[],
  tCardOperations: TCardOperationItem[],
  savedTCard: TCardItem,
  teamId: number,
): Promise<{ success: boolean, savedTCardStages?: TCardStageItem[], message?: string }> {

  const t = getServerT(locale, 'sermes');

  try {
    // Текущие стадии в БД
    const existingTCardStages = await tCardStagesRepository.find({
      where: { tcard_id: savedTCard.id },
    });

    // Какие стадии считаем удаляемыми (по id из БД)
    const stagesToDelete = existingTCardStages.filter(stage =>
      !tCardStages.some(newStage => newStage.id === stage.id)
    );

    // === ВАЖНО: проверка по ПЕРЕДАННЫМ операциям и по stage_idc ===
    if (stagesToDelete.length > 0) {
      // idc удаляемых стадий
      const stageIdcsToDelete = stagesToDelete
        .map(s => s.idc)
        .filter((v): v is number => typeof v === 'number');

      // хелпер: вытащить stage_idc из операции, учитываем возможные варианты имен
      const getOpStageIdc = (op: TCardOperationItem): number | null => {
        const anyOp = op as any;
        return (
          (typeof anyOp.stage_idc === 'number' && anyOp.stage_idc) ??
          (typeof anyOp.stageIdc === 'number' && anyOp.stageIdc) ??
          (anyOp.stage && typeof anyOp.stage.idc === 'number' && anyOp.stage.idc) ??
          null
        );
      };

      // операции из "нового состава", которые всё ещё ссылаются на удаляемые стадии (по idc)
      const blockingOps = tCardOperations.filter(op => {
        const sidc = getOpStageIdc(op);
        return sidc !== null && stageIdcsToDelete.includes(sidc);
      });

      if (blockingOps.length > 0) {
        // логируем и выходим
        void ulogger.error({
          userId,
          location: "handlers-update/updateStages",
          event: "refuse_delete_stage_with_ops",
          message: `Попытка удалить стадии, на которые указывают переданные операции (по idc): tCardId=${savedTCard.id}, tCardIdc=${savedTCard.idc}`,
          context: {
            stageIdcsToDelete,
            blockingOpsIdcs: blockingOps.map(o => (o as any).idc ?? null).filter(Boolean),
          },
        }).catch(() => { console.error("logger error"); });

        /* "Невозможно удалить стадию, в ней есть операции. Сначала удалите операции из стадии." */
        return { success: false, message: t('mes.impossibleToDelStage') };
      }
    }
    // === КОНЕЦ правки проверки ===

    // 1b. Удаляем стадии (операций на них нет согласно проверке выше)
    if (stagesToDelete.length > 0) {
      await tCardStagesRepository.remove(stagesToDelete);
    }

    // 2. Добавляем новые стадии
    const newStages = tCardStages
      .filter(stage => !existingTCardStages.some(existingStage => existingStage.id === stage.id))
      .map(stage => tCardStagesRepository.create({
        idc: stage.idc,
        code: stage.code,
        tcard_id: savedTCard.id,
        team_id: teamId,
      }));

    const savedNewStages = newStages.length > 0 ? await tCardStagesRepository.save(newStages) : [];

    // 3. Обновляем существующие стадии (если нужно)
    const updatedStages = tCardStages
      .filter(stage => existingTCardStages.some(existingStage => existingStage.id === stage.id))
      .map(stage => {
        const existingStage = existingTCardStages.find(existing => existing.id === stage.id);
        if (!existingStage) return null;
        existingStage.code = stage.code;
        return existingStage;
      })
      .filter(Boolean) as TCardStageTable[];

    const savedUpdatedStages = updatedStages.length > 0 ? await tCardStagesRepository.save(updatedStages) : [];

    // 4. Результат
    const savedTCardStages = [...savedNewStages, ...savedUpdatedStages]
      .sort((a, b) => a.code - b.code)
      .map(stage => ({
        id: stage.id,
        idc: stage.idc,
        code: stage.code,
      } as TCardStageItem));

    const changed =
      (stagesToDelete.length > 0) ||
      (savedNewStages.length > 0) ||
      (savedUpdatedStages.length > 0);

    return {
      success: true,
      savedTCardStages,
      message: changed ? '' : 'No changes',
    };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateStages",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateStages",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! ОПЕРАЦИИ
export async function updateOperations(
  userId: number,
  locale: string,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
  tCardOperations: TCardOperationItem[],
  savedTCard: TCardItem,
  savedTCardStages: TCardStageItem[],
  teamId: number,
): Promise<{
  success: boolean;
  message?: string;
  savedTCardOperations?: TCardOperationItem[];
}> {

  const t = getServerT(locale, 'sermes');

  try {
    // Получаем существующие операции для данного tCard
    const existingTCardOperations = await tCardOperationsRepository.find({
      where: { tcard_id: savedTCard.id },
    });

    // Определяем операции на удаление, добавление и обновление
    const operationsToDelete = existingTCardOperations.filter(
      op => !tCardOperations.some(newOp => newOp.id === op.id)
    );

    const operationsToAdd = tCardOperations.filter(
      op => !existingTCardOperations.some(existingOp => existingOp.id === op.id)
    );

    const operationsToUpdate = tCardOperations.filter(
      op => existingTCardOperations.some(existingOp => existingOp.id === op.id)
    );

    // Удаляем связанные продукты перед удалением операций    
    if (operationsToDelete.length > 0) {
      const operationIds = operationsToDelete.map(op => op.id);
      await tCardProductRepository.delete({ operation_id: In(operationIds) });
      await tCardOperationsRepository.remove(operationsToDelete);
    }

    // Добавляем новые операции
    const newOperations = operationsToAdd.map(op => {
      const savedStage = savedTCardStages.find(stage => stage.idc === op.stage.idc);
      // if (!savedStage || !op.action.id) return null;
      if (!savedStage) return null;

      return tCardOperationsRepository.create({
        idc: op.idc,
        stage_id: savedStage.id,
        order: op.order,
        action_id: op.action.id ?? null,
        duration: op.duration,
        tcard_id: savedTCard.id,
        status: op.status,
        coment: op.coment,
        fix_oper_idc: op.fixOperIdc,
        team_id: teamId, // Добавляем team_id
      });
    }).filter(Boolean) as TCardOperationTable[];

    const savedNewOperations = await tCardOperationsRepository.save(newOperations)

    // Обновляем существующие операции
    const updatedOperations = operationsToUpdate.map(op => {
      const existingOperation = existingTCardOperations.find(eo => eo.id === op.id);
      const savedStage = savedTCardStages.find(stage => stage.idc === op.stage.idc);

      if (!savedStage || !op.action.id) return null;

      return {
        ...existingOperation,
        stage_id: savedStage.id,
        action_id: op.action.id,
        order: op.order,
        duration: op.duration,
        status: op.status,
        coment: op.coment,
        fix_oper_idc: op.fixOperIdc,
        team_id: teamId,
      };
    }).filter(Boolean) as TCardOperationTable[];

    let savedUpdatedOperations: TCardOperationTable[] = [];
    if (updatedOperations.length > 0) {
      savedUpdatedOperations = await tCardOperationsRepository.save(updatedOperations);
    }

    // Формируем итоговый массив
    const operIds = [...savedNewOperations, ...savedUpdatedOperations].map(op => op.id);
    let savedTCardOperations: TCardOperationItem[] = [];

    if (operIds.length > 0) {
      const rawOperations = await tCardOperationsRepository
        .createQueryBuilder('oper')
        .leftJoin('actions', 'action', 'oper.action_id = action.id')
        .leftJoin('t_card_stages', 'stage', 'oper.stage_id = stage.id')
        .addSelect([
          'action.id', 'action.title', 'action.code', 'action.interruptible',
          'stage.id', 'stage.idc', 'stage.code'
        ])
        .where('oper.id IN (:...ids)', { ids: operIds })
        .getRawMany();

      savedTCardOperations = rawOperations.map(raw => ({
        id: raw.oper_id,
        idc: raw.oper_idc,
        stage: { id: raw.stage_id, idc: raw.stage_idc, code: raw.stage_code },
        action: {
          id: raw.action_id,
          title: raw.action_title,
          code: raw.action_code,
          interruptible: raw.action_interruptible
        },
        order: raw.oper_order,
        duration: raw.oper_duration,
        status: raw.oper_status,
        coment: raw.oper_coment,
        fixOperIdc: raw.oper_fix_oper_idc,
        out: [],
        inn: []
      } as TCardOperationItem));
    }

    return { success: true, savedTCardOperations };
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateOperations",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateOperations",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! ПРОДУКТЫ
export async function updateProducts(
  userId: number,
  locale: string,
  products: ProductItem[],
  tCardProductRepository: Repository<TCardProductTable>,
  savedTCard: TCardItem,
  savedTCardOperations: TCardOperationItem[],
  tCardProducts: TCardProductItem[],
  tCardMaterials: TCardProductItem[],
  tCardWastes: TCardProductItem[],
  tCardOperations: TCardOperationItem[],
  teamId: number,
): Promise<{ success: boolean; savedTCardProducts?: TCardProductItem[], message?: string }> {

  interface TCardProductItemRecord extends TCardProductItem {
    type: TypeEnum;
    operationId: number | null;
    productIdc: number;
  }

  const t = getServerT(locale, 'sermes');

  try {
    // Карта операций (idc -> id)
    const operationsMap = Object.fromEntries(
      savedTCardOperations.map(op => [op.idc, op.id])
    );

    // Продукты операций
    const outArr = tCardOperations.flatMap(op =>
      op.out.map(tp => ({
        ...tp,
        type: TypeEnum.O,
        operationId: operationsMap[op.idc] ?? null,  // приводим к null
        productIdc: tp.product.idc
      }))
    );

    const innArr = tCardOperations.flatMap(op =>
      op.inn.map(tp => ({
        ...tp,
        type: TypeEnum.I,
        operationId: operationsMap[op.idc] ?? null,  // приводим к null
        productIdc: tp.product.idc
      }))
    );
    // Полный список продуктов
    const tCardAllProducts: TCardProductItemRecord[] = [
      ...tCardProducts.map(tp => ({ ...tp, type: TypeEnum.P, operationId: null, productIdc: tp.product.idc })),
      ...tCardMaterials.map(tp => ({ ...tp, type: TypeEnum.M, operationId: null, productIdc: tp.product.idc })),
      ...tCardWastes.map(tp => ({ ...tp, type: TypeEnum.W, operationId: null, productIdc: tp.product.idc })),
      ...outArr,
      ...innArr
    ];

    // Существующие продукты
    const existingTCardProducts = await tCardProductRepository.find({
      where: { tcard_id: savedTCard.id },
    });

    // Продукты для CRUD операций
    const productsToDelete = existingTCardProducts.filter(ep =>
      !tCardAllProducts.some(np => np.id === ep.id && np.code === ep.code && np.type === ep.type && np.qtu === ep.qtu)
    );

    const productsToAdd = tCardAllProducts.filter(np =>
      !existingTCardProducts.some(ep => ep.id === np.id && ep.code === np.code && ep.type === np.type && ep.qtu === np.qtu)
    );

    const productsToUpdate = tCardAllProducts.filter(np =>
      existingTCardProducts.some(ep => ep.id === np.id && ep.code === np.code && ep.type === np.type && ep.qtu === np.qtu)
    );

    
    // Удаляем продукты
    if (productsToDelete.length > 0) await tCardProductRepository.remove(productsToDelete);

    // Добавляем новые
    const newProducts = productsToAdd.map(tp => {
      const operationId = savedTCardOperations.find(o => o.id === tp.operationId)?.id ?? null;
      const product = products.find(p => p.idc === tp.product.idc);
      if (!product) return null;

      return tCardProductRepository.create({
        code: tp.code,
        type: tp.type,
        product_id: product.id,
        qtu: tp.qtu,
        operation_id: operationId,
        tcard_id: savedTCard.id,
        team_id: teamId,
      });
    }).filter(Boolean) as TCardProductTable[];

    const savedNewProducts = newProducts.length ? await tCardProductRepository.save(newProducts) : [];

    // Обновляем существующие
    const updatedProducts = productsToUpdate.map(tp => {
      const existingProduct = existingTCardProducts.find(ep => ep.id === tp.id);
      const product = products.find(p => p.id === tp.product.id);
      if (!product || !existingProduct) return null;

      return {
        ...existingProduct,
        code: tp.code,
        product_id: product.id,
        qtu: tp.qtu,
      };
    }).filter(Boolean) as TCardProductTable[];

    const savedUpdatedProducts = updatedProducts.length ? await tCardProductRepository.save(updatedProducts) : [];

    const savedTCardProducts: TCardProductItem[] = [...savedNewProducts, ...savedUpdatedProducts]
      .map(tProduct => {
        const product = products.find(p => p.id === tProduct.product_id);
        return {
          id: tProduct.id,
          code: tProduct.code,
          qtu: tProduct.qtu,
          product: product ?? {} as ProductItem, // гарантируем структуру
        } as TCardProductItem;
      });

    return { success: true, savedTCardProducts };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateProducts",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateProducts",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! КАТАЛОГ ПРОДУКТОВ
export async function updateCatalogProducts(
  userId: number,
  locale: string,
  productRepository: Repository<ProductTable>,
  savedTCard: TCardItem,
  products: ProductItem[],
  teamId: number,
): Promise<{ success: boolean; savedProducts?: ProductItem[], message?: string }> {

  const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'
  try {


    // Получаем существующие продукты с привязанными UOM
    const existingProductsRaw = await productRepository
      .createQueryBuilder('product')
      .leftJoin('uoms', 'uom', 'product.uom_id = uom.id')
      .addSelect(['uom.id', 'uom.title', 'uom.code'])
      .where('product.tcard_id = :tcardId', { tcardId: savedTCard.id })
      .getRawMany();

    const existingProducts: ProductItem[] = existingProductsRaw.map(row => ({
      id: row.product_id,
      idc: row.product_idc,
      title: row.product_title,
      sync: row.product_sync,
      uom: {
        id: row.uom_id,
        title: row.uom_title,
        code: row.uom_code
      }
    }));

    // 1. Продукты для удаления
    const productsToDelete = existingProducts.filter(p => !products.some(np => np.id === p.id));
    if (productsToDelete.length > 0) {
      const idsToDelete = productsToDelete.map(p => p.id!) as number[];
      await productRepository.delete(idsToDelete);
    }

    // 2. Продукты для добавления
    let savedNewProducts: ProductItem[] = [];
    const productsToAdd = products.filter(p => !existingProducts.some(ep => ep.id === p.id));

    if (productsToAdd.length > 0) {

      const plainProducts = productsToAdd.map(p => ({
        idc: p.idc,
        title: p.title,
        uom_id: p.uom.id,
        tcard_id: savedTCard.id,
        sync: p.sync,
        team_id: teamId
      }));

      const inserted = await productRepository.save(plainProducts);
      savedNewProducts = inserted.map(saved => {
        const source = productsToAdd.find(p => p.idc === saved.idc)!;
        return {
          id: saved.id,
          idc: saved.idc,
          title: saved.title,
          sync: saved.sync,
          uom: source.uom // Используем UOM из исходного массива
        };
      });
    }

    // 3. Продукты для обновления
    let savedUpdatedProducts: ProductItem[] = [];
    const productsToUpdate = products.filter(p => existingProducts.some(ep => ep.id === p.id));

    if (productsToUpdate.length > 0) {
      const updateEntities = productsToUpdate.map(p => ({
        id: p.id,
        idc: p.idc,
        title: p.title,
        uom_id: p.uom.id,
        tcard_id: savedTCard.id,
        sync: p.sync,
        team_id: teamId
      }));

      const updated = await productRepository.save(updateEntities);
      savedUpdatedProducts = updated.map(saved => {
        const source = productsToUpdate.find(p => p.id === saved.id)!;
        return {
          id: saved.id,
          idc: saved.idc,
          title: saved.title,
          sync: saved.sync,
          uom: source.uom
        };
      });
    }

    // Объединяем новые и обновленные продукты
    const savedProducts: ProductItem[] = [...savedNewProducts, ...savedUpdatedProducts];

    // Проверка сохраненных данных
    if (products.length === 0) return { success: true, savedProducts };

    const changed =
      (productsToDelete.length > 0) ||
      (savedNewProducts.length > 0) ||
      (savedUpdatedProducts.length > 0);

    return {
      success: true,
      savedProducts,
      message: changed ? '' : 'No changes',
    };


  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateCatalogProducts",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateCatalogProducts",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

///////////////////// СТАТУСЫ//////////////////

export async function updateStatusOperationByTCardId(
  userId: number,
  locale: string,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardId: number,
  status: StatusEnum
): Promise<{ success: boolean, message: string }> {
  try {

    // Обновляем статус всех операций, где tcard_id совпадает с переданным
    const updatedOperations = await tCardOperationsRepository.update({ tcard_id: tCardId }, { status });

    // Проверяем, были ли обновлены операции
    if (updatedOperations.affected && updatedOperations.affected > 0) {
      return { success: true, message: "Статус операций успешно обновлен" };
    } else {
      return { success: false, message: "Операции не были обновлены" };
    }

  } catch (error: unknown) {
    let message = "Ошибка обновления операций";
    if (error instanceof Error) {
      message = error.message;
      console.error("Ошибка обновления операций:", error);
    } else {
      console.error("Неизвестная ошибка обновления операций:", error);
    }
    return { success: false, message };
  }

}
//! обновление статусов операций по id
export async function updateStatusOperationByOperIds(
  userId: number,
  locale: string,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  operIds: number[],
  status: StatusEnum
): Promise<{ success: boolean, message?: string }> {

  const t = getServerT(locale, 'sermes');
  try {

    if (!operIds?.length) {
      return { success: true };
    }
    await tCardOperationsRepository.update(operIds, { status });
    return { success: true, };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateStatusOperationsByOperIds",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateStatusOperationsByOperIds",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! обновление статуса операции по id
export async function updateStatusOperationByOperId(
  userId: number,
  locale: string,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  operId: number,
  status: StatusEnum
): Promise<{ success: boolean, message?: string }> {
  const t = getServerT(locale, 'sermes');
  try {
    await tCardOperationsRepository.update(operId, { status });
    return { success: true };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateStatusOperationsByOperId",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateStatusOperationsByOperId",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }

}

//! Функция для обновления статусов операций по массиву operIds
export async function updateStatusOperationsByOperIds(
  userId: number,
  locale: string,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  opersIds: number[],
  status: StatusEnum
): Promise<{ success: boolean, message?: string }> {

  const t = getServerT(locale, 'sermes');
  try {
    if (!opersIds?.length) return { success: true, message: 'No ids' };

    const ids = Array.from(new Set(opersIds.filter(Number.isFinite)));
    if (ids.length === 0) return { success: true, message: 'No valid ids' };

    // обновляем только те строки, где статус другой (меньше лишних UPDATE)
    const updateResult = await tCardOperationsRepository.update(
      { id: In(ids), status: Not(status) },
      { status }
    );
    const affected = updateResult.affected ?? 0;
    if (affected > 0) {
      return { success: true, message: `Updated: ${affected}` };
    } else {
      // тут либо все уже были в нужном статусе, либо id не найдены
      // при желании можно проверить существование:
      // const countExisting = await tCardOperationsRepository.countBy({ id: In(ids) });
      return { success: true, message: 'No changes' };
    }

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateStatusOperationsByOperIds",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateStatusOperationsByOperIds",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }

}

//! Функция для обновления статусов загрузок (интервалов)
export async function updateStatusLoads(
  userId: number,
  locale: string,
  unitLoadRepository: Repository<UnitLoadTable>,
  loadsIds: number[],
  status: StatusEnum
): Promise<{ success: boolean; message: string }> {

  const t = getServerT(locale, 'sermes');
  try {
    if (loadsIds.length === 0) {
      return {
        success: true,
        // message: "Нет загрузок для обновления" 
        message: `${t('mes.noLoadsForUpdate')}`
      };
    }

    // фильтруем мусор и дубликаты
    const ids = Array.from(new Set(loadsIds.filter(Number.isFinite)));
    if (ids.length === 0) {
      return { success: true, message: t('mes.noLoadsForUpdate') };
    }

    // избегаем лишних UPDATE: обновляем только где статус отличается
    const result = await unitLoadRepository.update(
      { id: In(ids), status: Not(status) },
      { status }
    );

    const affected = result.affected ?? 0;
    if (affected > 0) {
      return { success: true, message: `${t('mes.updatedLoads')}: ${affected}` };
    } else {
      // либо все уже были с этим статусом, либо id не найдены
      return { success: true, message: t('mes.noChanges') };
    }

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateStatusLoads",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateStatusLoads",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

//! Функция для обновления статуса карты
export async function updateStatusTCard(
  userId: number,
  locale: string,
  tCardRepository: Repository<TCardTable>,
  tCardId: number,
  status: StatusEnum
): Promise<{ success: boolean; message?: string }> {
  const t = getServerT(locale, 'sermes');
  try {
    const result = await tCardRepository.update(tCardId, { status });

    if (result.affected && result.affected > 0) {
      return {
        success: true,        
        message: `${t('mes.tCardStatusUpdated')} id: ${tCardId}`

      };
    } else {
      return {
        success: false,        
        message: `${t('mes.tCardStatusNotUpdated')} id: ${tCardId}`
      };
    }

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateStatusTCard",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateStatusTCard",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }
}

///////////////////// SUPPORT //////////////////

//! Функция для обновления сообщения тех поддержки
export async function updateSupportMessage(
  userId: number,
  locale: string,
  supportMessage: SupportMailItem,
  supportRepository: Repository<MailTable>
): Promise<{ success: boolean, savedMessage?: MailTable, message?: string }> {
  const t = getServerT(locale, 'sermes');
  try {
    // Создание нового сообщения для базы данных
    const newSupportMessage = supportRepository.create({
      date: supportMessage.date,
      title: supportMessage.title,
      body: supportMessage.body,
      fromUser: supportMessage.fromUser,
      basedOn: supportMessage.basedOn,
      user_id: userId,
      team_id: supportMessage.teamId,
    });

    // Сохраняем новое сообщение в базе данных
    const savedMessage = await supportRepository.save(newSupportMessage);

    // Если сообщение сохранено успешно, возвращаем его с ID
    return {
      success: true,
      savedMessage: savedMessage,
    };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/updateSupportMessage",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "updateSupportMessage",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }

}

//! Функция для пометки что сообщение обработано
export async function cnangeStatusMail(
  userId: number,
  locale: string,
  id: number,
  status: StatusEnum,
  supportRepository: Repository<MailTable>
): Promise<{ success: boolean; message: string }> {
  const t = getServerT(locale, 'sermes');
  try {
    if (!Number.isFinite(id)) {
      return {
        success: false,        
        message: t('mes.uncorrectMailId')
      };
    }

    // Обновляем только нужное поле
    const result = await supportRepository.update({ id }, { status: status });

    if ((result.affected ?? 0) === 0) {
      return {
        success: false,        
        message: t('mes.mailNotFound')
      };
    }

    return {
      success: true,      
      message: t('mes.mailProcessed')

    };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-update/cnangeStatusMail",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "cnangeStatusMail",
    }).catch(() => { console.error("logger error"); });

    return { success: false, message: 'db_error: ' + msg };
  }

}

// банер
export async function setBaner(
  userId: number,
  locale: string,
  baner: BanerItem,
  banerRepository: Repository<BanerTable>
): Promise<BanerItem> {

  const newBaner = {
    active: true,
    date_from: baner.dateFrom,
    date_to: baner.dateTo,
    locale: baner.locale,
    message: baner.message,
  } as BanerTable
  const savedBaner = await banerRepository.save(newBaner);

  const baner__ = {
    message: savedBaner.message,
    locale: savedBaner.locale,    
    dateFrom: savedBaner.date_from,
    dateTo: savedBaner.date_to,
  };

  return baner__;
}
