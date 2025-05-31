
import { Repository, In, Any } from 'typeorm';
// tables
import { UnitTable } from '@/pages/db/models/catalogs/units'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';
import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardStageTable } from '@/pages/db/models/data/t_card_stages'

import { TemplateTable } from '@/pages/db/models/catalogs/templates'

import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TypeEnum } from '@/types';
import { ActionTable } from '@/pages/db/models/catalogs/actions';
import { UOMsTable } from '@/pages/db/models/catalogs/uoms';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions';
import { TeamScheduleTable } from '@/pages/db/models/plan/team_schedule';
import { SettingsTable } from '@/pages/db/models/plan/settings';

import { UserTable } from '@/pages/db/models/catalogs/users';
import { UserUnitTable } from '@/pages/db/models/catalogs/user_unit';




// types
import { UnitItem, UserItem, UnitLoadItem, UnitActionItem, UnitBelongEnum, UnitTypeEnum, UnitExceptionItem, TimeTypeEnum, DaysOfWeek, TimeZoneEnum, TCardOperationTermsItem } from '@/types';
import { TCardItem, TCardOperationItem, TCardProductItem, UserUnitItem, TCardStageItem, ActionItem, UOMItem, ScheduleItem, SettingsItem, TCardTermsItem, TemplateItem, StatusEnum } from '@/types';


// НАСТРОЙКИ
export async function updateSettings(
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

// ШАБЛОНЫ
export async function updateTemplates(
  templatesRepository: Repository<TemplateTable>,
  templates: TemplateItem[],
  teamId: number
) {

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
  let savedNewTemplates = [] as TemplateTable[]
  if (newTemplates.length > 0) savedNewTemplates = await templatesRepository.save(newTemplates);
  if (!savedNewTemplates) return { success: false, message: "Не удалось сохранить действие" }


  // // Обновляем существующие единицы измерения
  const updatedTemplates = templatesToUpdate.map(template => {
    const existingTemplate = existingTemplates.find(existingTemplate => existingTemplate.id === template.id);
    if (existingTemplate) {
      existingTemplate.name = template.name;
      existingTemplate.fileContent = template.fileContent;
      return templatesRepository.create(existingTemplate);
    }
    return null;
  }).filter(template => template !== null);

  let savedUpdatedTemplates = [] as TemplateTable[]
  if (updatedTemplates.length > 0) savedUpdatedTemplates = await templatesRepository.save(updatedTemplates);
  if (!savedUpdatedTemplates) return { success: false, message: "Не удалось сохранить шаблоны " }

  // Все единицы измерения сохранены, проверка
  let error = ""
  const savedTemplates = [...savedNewTemplates, ...savedUpdatedTemplates] as TemplateTable[]

  // вход и выход массив единицы измерения не совпадает количество записей - чтото не сохранилось
  if (savedTemplates.length > 0 && templates.length !== savedTemplates.length) {
    error = `Не удалось сохранить шаблоны`;
    //  console.log(error);
    return { success: false, message: error }
  }

  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedTemplates.length > 0 && templates.length > 0) {
    if (savedTemplates.length > 0) {

      savedTemplates.forEach((template, index) => {
        if (template.id) {
          console.log(`Шаблон успешно сохранен с id: ${template.id}`);
        } else {
          error = `Ошибка при сохранении шаблона ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить шаблон`;
      console.log(error);
      return { success: false, message: error }
    }
  }
  return { success: true, savedTemplates: savedTemplates, message: "" }
}

// ЕДИНИЦЫ ИЗМЕРЕНИЯ
export async function updateUOMS(
  uomsRepository: Repository<UOMsTable>,
  uoms: UOMItem[],
  teamId: number
) {

  // СПИСОК ДЕЙСТВИЙ в базе
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
  let savedNewUOMS = [] as UOMsTable[]
  if (newUOMS.length > 0) savedNewUOMS = await uomsRepository.save(newUOMS);
  if (!savedNewUOMS) return { success: false, message: "Не удалось сохранить действие" }


  // Обновляем существующие единицы измерения
  const updatedUOMS = uomsToUpdate.map(uom => {
    const existingUOM = existingUOMS.find(existingUOM => existingUOM.id === uom.id);
    if (existingUOM) {
      existingUOM.title = uom.title;
      existingUOM.code = uom.code;
      return uomsRepository.create(existingUOM);
    }
    return null;
  }).filter(unitAction => unitAction !== null);

  let savedUpdatedUOMS = [] as UOMsTable[]
  if (updatedUOMS.length > 0) savedUpdatedUOMS = await uomsRepository.save(updatedUOMS);
  if (!savedUpdatedUOMS) return { success: false, message: "Не удалось сохранить единицы измерения " }

  // Все единицы измерения сохранены, проверка
  let error = ""
  const savedUOMS = [...savedNewUOMS, ...savedUpdatedUOMS] as UOMsTable[]

  // вход и выход массив единицы измерения не совпадает количество записей - чтото не сохранилось
  if (savedUOMS.length > 0 && uoms.length !== savedUOMS.length) {
    error = `Не удалось сохранить единицы измерения`;
    console.log(error);
    return { success: false, message: error }
  }

  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedUOMS.length > 0 && uoms.length > 0) {
    if (savedUOMS.length > 0) {

      savedUOMS.forEach((uom, index) => {
        if (uom.id) {
          console.log(`Единица измерения успешно сохранена с id: ${uom.id}`);
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
  return { success: true, savedUOMS: savedUOMS }
}

// ДЕЙСТВИЯ
export async function updateActions(
  actionsRepository: Repository<ActionTable>,
  actions: ActionItem[],
  team_id: number
) {

  // СПИСОК ДЕЙСТВИЙ в базе
  const existingActions = await actionsRepository.find({ where: { team_id: team_id } });

  // 1. Найдём удалённые операции
  const actionToDelete = existingActions.filter(action =>
    !actions.some(newActions => newActions.id === action.id) // Сравниваем id существующих стадий с переданными
  );

  // 2. Найдём новые стадии, которых нет в базе
  const actionToAdd = actions.filter(action =>
    !existingActions.some(existingAction => existingAction.id === action.id) // Сравниваем id переданных стадий с существующими
  );

  // 3. Найдём существующие стадии для обновления
  const actionToUpdate = actions.filter(action =>
    existingActions.some(existingAction => existingAction.id === action.id) // Сравниваем id для существующих стадий
  );

  // Удаляем старые стадии
  if (actionToDelete.length > 0) {
    await actionsRepository.remove(actionToDelete);
  }

  // Добавляем новые стадии
  const newAction = actionToAdd.map(action => {
    return actionsRepository.create({
      code: action.code,
      title: action.title,
      interruptible: action.interruptible,
      team_id: team_id,
    });
  });
  let savedNewActions = [] as ActionTable[]
  if (newAction.length > 0) savedNewActions = await actionsRepository.save(newAction);
  if (!savedNewActions) return { success: false, message: "Не удалось сохранить действие" }


  // Обновляем существующие стадии
  const updatedActions = actionToUpdate.map(action => {
    const existingAction = existingActions.find(existingAction => existingAction.id === action.id);
    if (existingAction) {
      existingAction.code = action.code,
        existingAction.title = action.title; // Обновляем нужные поля
      existingAction.interruptible = action.interruptible; // Обновляем нужные поля
      return actionsRepository.create(existingAction);
    }
    return null;
  }).filter(unitAction => unitAction !== null);

  let savedUpdatedActions = [] as ActionTable[]
  if (updatedActions.length > 0) savedUpdatedActions = await actionsRepository.save(updatedActions);
  if (!savedUpdatedActions) return { success: false, message: "Не удалось сохранить действия " }

  // Все действия сохранены, проверка
  let error = ""
  const savedActions = [...savedNewActions, ...savedUpdatedActions] as ActionTable[]

  // вход и выход массив операций не совпадает количество записей - чтото не сохранилось
  if (savedActions.length > 0 && actions.length !== savedActions.length) {
    error = `Не удалось сохранить действия`;
    console.log(error);
    return { success: false, message: error }
  }

  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedActions.length > 0 && actions.length > 0) {
    if (savedActions.length > 0) {

      savedActions.forEach((action, index) => {
        if (action.id) {
          console.log(`Действие успешно сохранено с id: ${action.id}`);
        } else {
          error = `Ошибка при сохранении действия ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить действия`;
      console.log(error);
      return { success: false, message: error }
    }
  }
  return { success: true, savedActions: savedActions }
}

// ЮНИТЫ
export async function updateUnits(
  unitRepository: Repository<UnitTable>,
  units: UnitItem[],
  teamId: number
) {

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

  let savedNewUnits = [] as UnitTable[];
  if (newUnits.length > 0) savedNewUnits = await unitRepository.save(newUnits);
  if (!savedNewUnits) return { success: false, message: "Не удалось сохранить юниты" };

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
      return unitRepository.create(existingUnit);
    }
    return null;
  }).filter(unit => unit !== null);

  let savedUpdatedUnits = [] as UnitTable[];
  if (updatedUnits.length > 0) savedUpdatedUnits = await unitRepository.save(updatedUnits);
  if (!savedUpdatedUnits) return { success: false, message: "Не удалось обновить юниты" };

  // Все юниты сохранены, проверка
  let error = "";
  const savedUnits = [...savedNewUnits, ...savedUpdatedUnits] as UnitTable[];

  // Проверка, что количество юнитов совпадает
  if (savedUnits.length > 0 && units.length !== savedUnits.length) {
    error = `Не удалось сохранить юниты`;
    console.log(error);
    return { success: false, message: error };
  }

  // Проверка, что все объекты имеют сгенерированный id
  if (savedUnits.length > 0) {
    savedUnits.forEach((unit, index) => {
      if (unit.id) {
        console.log(`Юнит ${index + 1} успешно сохранён с id: ${unit.id}`);
      } else {
        error = `Ошибка при сохранении юнита ${index + 1}`;
        console.log(error);
        return { success: false, message: error };
      }
    });
  } else {
    error = `Не удалось сохранить юниты`;
    console.log(error);
    return { success: false, message: error };
  }

  return { success: true, savedUnits: savedUnits };
}

// ДЕЙСТВИЯ ЮНИТА
export async function updateUnitActions(
  unitActionsRepository: Repository<UnitActionTable>,
  unitActions: UnitActionItem[],
  teamId: number
) {

  // СПИСОК ЮНИТОВ в базе
  const existingUnitActions = await unitActionsRepository.find({ where: { team_id: teamId } });

  // 1. Найдём удалённые действия Юнита
  const unitActionToDelete = existingUnitActions.filter(unitAction =>
    !unitActions.some(newUnitActions => newUnitActions.id === unitAction.id) // Сравниваем id существующих стадий с переданными
  );

  // 2. Найдём новые действия Юнита, которых нет в базе
  const unitActionToAdd = unitActions.filter(unitAction =>
    !existingUnitActions.some(existingUnitAction => existingUnitAction.id === unitAction.id) // Сравниваем id переданных стадий с существующими
  );

  // 3. Найдём существующие действия Юнита для обновления
  const unitActionToUpdate = unitActions.filter(unitAction =>
    existingUnitActions.some(existingUnitAction => existingUnitAction.id === unitAction.id) // Сравниваем id для существующих стадий
  );

  // Удаляем старые действия Юнита
  if (unitActionToDelete.length > 0) {
    await unitActionsRepository.remove(unitActionToDelete);
  }

  // Добавляем новые действия Юнита
  const newUnitAction = unitActionToAdd.map(unitAction => {
    return unitActionsRepository.create({
      idc: unitAction.idc,
      koef: unitAction.koef,
      action_id: unitAction.action.id,
      action: unitAction.action,
      unit_id: unitAction.unitId,
      unit_idc: unitAction.unitIdc,
      team_id: teamId,
      // coment: unitAction.coment, // пока не используется

    });
  });
  let savedNewUnitActions = [] as UnitActionTable[]
  if (newUnitAction.length > 0) savedNewUnitActions = await unitActionsRepository.save(newUnitAction);
  if (!savedNewUnitActions) return { success: false, message: "Не удалось сохранить действия Юнитов" }

  // Обновляем существующие действия
  const updatedUnitActions = unitActionToUpdate.map(unitAction => {
    const existingUnitAction = existingUnitActions.find(existingUnitAction => existingUnitAction.id === unitAction.id);
    if (existingUnitAction) {
      existingUnitAction.koef = unitAction.koef; // Обновляем нужные поля
      existingUnitAction.action_id = unitAction.action.id;
      return unitActionsRepository.create(existingUnitAction);
    }
    return null;
  }).filter(unitAction => unitAction !== null);

  let savedUpdatedUnitActions = [] as UnitActionTable[]
  if (updatedUnitActions.length > 0) savedUpdatedUnitActions = await unitActionsRepository.save(updatedUnitActions);

  if (!savedUpdatedUnitActions) return { success: false, message: "Не удалось сохранить действия Юнитов" }

  // Все действия юнита сохранены, проверка
  let error = ""
  const savedUnitActions = [...savedNewUnitActions, ...savedUpdatedUnitActions] as UnitActionTable[]

  // вход и выход массив операций не совпадает количество записей - чтото не сохранилось
  if (savedUnitActions.length > 0 && unitActions.length !== savedUnitActions.length) {
    error = `Не удалось сохранить стадии`;
    console.log(error);
    return { success: false, message: error }
  }

  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedUnitActions.length > 0 && unitActions.length > 0) {
    if (savedUnitActions.length > 0) {

      savedUnitActions.forEach((unitAction, index) => {
        if (unitAction.id) {
          console.log(`Действие юнита ${index + 1} успешно сохранено с id: ${unitAction.id}`);
        } else {
          error = `Ошибка при сохранении стадии ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить стадии`;
      console.log(error);
      return { success: false, message: error }
    }
  }
  return { success: true, savedUnitActions: savedUnitActions }
}

// ОТКЛОНЕНИЯ ОТ РАСПИСАНИЯ ЮНИТА
export async function updateExceptions(
  unitExceptionsRepository: Repository<UnitExceptionTable>,
  unitExceptions: UnitExceptionItem[],
  teamId: number
) {

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
    let date = new Date(unitException.date);
    return unitExceptionsRepository.create({
      idc: unitException.idc,
      date: date,
      type: unitException.type,
      timeStart: unitException.timeStart,
      timeFinish: unitException.timeFinish,
      unit_id: unitException.unitId,
      unit_idc: unitException.unitIdc,
      team_id: teamId,
    });
  });
  let savedNewUnitExceptions = [] as UnitExceptionTable[]
  if (newUnitException.length > 0) savedNewUnitExceptions = await unitExceptionsRepository.save(newUnitException);
  if (!savedNewUnitExceptions) return { success: false, message: "Не удалось сохранить отклонения Юнита" }

  // Обновляем существующие исключения
  const updatedUnitExceptions = unitExceptionToUpdate.map(unitException => {
    const existingUnitException = existingUnitExceptions.find(existingUnitException => existingUnitException.id === unitException.id);
    if (existingUnitException) {
      existingUnitException.date = new Date(unitException.date);
      existingUnitException.timeFinish = unitException.timeFinish;
      existingUnitException.timeStart = unitException.timeStart;
      existingUnitException.type = unitException.type;
      return unitExceptionsRepository.create(existingUnitException);
    }
    return null;
  }).filter(unitException => unitException !== null);

  let savedUpdatedUnitExceptions = [] as UnitExceptionTable[]
  if (updatedUnitExceptions.length > 0) savedUpdatedUnitExceptions = await unitExceptionsRepository.save(updatedUnitExceptions);

  if (!savedUpdatedUnitExceptions) return { success: false, message: "Не удалось сохранить отклонения Юнита" }

  // Все действия юнита сохранены, проверка
  let error = ""
  const savedUnitExceptions = [...savedNewUnitExceptions, ...savedUpdatedUnitExceptions] as UnitExceptionTable[]

  // вход и выход массив операций не совпадает количество записей - чтото не сохранилось
  if (savedUnitExceptions.length > 0 && unitExceptions.length !== savedUnitExceptions.length) {
    error = `Не удалось сохранить стадии`;
    console.log(error);
    return { success: false, message: error }
  }

  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedUnitExceptions.length > 0 && unitExceptions.length > 0) {
    if (savedUnitExceptions.length > 0) {

      savedUnitExceptions.forEach((unitException, index) => {
        if (unitException.id) {
          console.log(`Отклонение юнита ${index + 1} успешно сохранено с id: ${unitException.id}`);
        } else {
          error = `Ошибка при сохранении отклонения ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить отклонения расписания юнита`;
      console.log(error);
      return { success: false, message: error }
    }
  }
  return { success: true, savedUnitExceptions: savedUnitExceptions }
}

// НАЗНАЧЕНИЯ ЮНИТА ПОЛЬЗОВАТЕЛЮ
export async function updateUsersUnits(
  usersUnitsRepository: Repository<UserUnitTable>,
  users_units: UserUnitItem[],  // Новый массив юнитов для пользователей
  teamId: number
) {
  // Получаем все существующие назначения юнитов в базе
  const existingUsersUnits = await usersUnitsRepository.find({ where: { team_id: teamId } });

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
    relations: ['unit', 'user'], // Загружаем связь с таблицей UnitTable
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

  return { success: true, savedUsersUnits: savedUsersUnits };
}

// Пользователи  снимаю отметку активности
export async function updateUsers(
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

// Обновление лоадов карты
export async function updateTCardLoads(
  teamId: number,
  tCardId: number,
  loads: UnitLoadItem[],
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean, loads: UnitLoadTable[], message: string }> {

  // // СПИСОК ДЕЙСТВИЙ в базе
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
  let savedNewLoads = [] as UnitLoadTable[];
  if (loadsToAdd.length > 0) {
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
  
  if (newLoads.length > 0) savedNewLoads = await unitLoadRepository.save(newLoads);
  if (!savedNewLoads) return { success: false, loads: [] as UnitLoadTable[], message: "Не удалось сохранить интервалы загрузок" }
  }

  // // Обновляем существующие лоады (только статус)
  const updatedLoads = loadsToUpdate.map(load => {
    const existingLoad = existingLoads.find(existingLoad => existingLoad.id === load.id);
    if (existingLoad) {
      existingLoad.status = load.status
      return unitLoadRepository.create(existingLoad);
    }
    return null;
  }).filter(load => load !== null);

  let savedUpdatedLoads = [] as UnitLoadTable[]
  if (updatedLoads.length > 0) savedUpdatedLoads = await unitLoadRepository.save(updatedLoads);
  if (!savedUpdatedLoads) return { success: false, loads: [] as UnitLoadTable[], message: "Не удалось сохранить интервалы загрузок" }

  // Все единицы измерения сохранены, проверка
  let error = ""
  const savedLoads = [...savedNewLoads, ...savedUpdatedLoads] as UnitLoadTable[]

  // вход и выход массив единицы измерения не совпадает количество записей - чтото не сохранилось
  if (loads.length !== savedLoads.length) {
    error = `Не удалось сохранить интервалы загрузки`;   
    return { success: false, loads: [] as UnitLoadTable[], message: error }
  }
 

  return { success: true, loads: savedLoads as UnitLoadTable[], message: "" }
}



///////////////////// КАРТА ТЕХНОЛОГИЧЕСКИХ ОПЕРАЦИЙ//////////////////

// получаю максимальный номер карты
// не беру id потому что он в пределах таблицы
async function generateNewNumberForTeam(tCardRepository: Repository<TCardTable>) {

  const result = await tCardRepository
    .createQueryBuilder("tCard")
    .select("MAX(CAST(tCard.idc AS int))", "maxNumber")
    .getRawOne();

  // Если результат не null, возвращаем максимальное значение, иначе 
  const maxNumber = result?.maxNumber || 0;

  // console.log(maxNumber);

  // Шаг 3: Генерируем новый номер
  const newNumber = maxNumber + 1;

  return newNumber;
}

// ТКАРТА
export async function updateCard(
  tCardRepository: Repository<TCardTable>,
  tCard: TCardItem,
  userId: number,
  teamId: number) {
  let savedTCard = null;
  let error = "";
  // генерим пользовательский номер карты
  let newCardNumber = Number(tCard.idc);

  if (tCard.idc === 0) {
    newCardNumber = await generateNewNumberForTeam(tCardRepository);
    if (!newCardNumber) {
      error = `Ошибка при генерации номера карты`;
      console.log(error);
      return { success: false, message: error }
    }
  }

  // Если id карты положительный, то обновляем, если нет - создаем новую
  if (tCard.id && tCard.id > 0) {
    // Обновляем существующую карту

    savedTCard = await tCardRepository.save({
      ...tCard,  // сохраняем все поля карты, включая id
      user_id: Number(userId),
      team_id: Number(teamId),
      max_idc: tCard.maxIdc,
      coment: tCard.coment,
      status: tCard.status,
    });

    // console.log('Карта успешно обновлена с id:', savedTCard.id);
  } else {
    // Создаем новую карту
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
    console.log('Новая карта успешно сохранена с id:', savedTCard.id);
  }

  // Проверка, что сохранение прошло успешно
  if (savedTCard && savedTCard.id) {
    // console.log('Карта успешно сохранена или обновлена с id:', savedTCard.id);
  } else {
    error = `Ошибка при сохранении или обновлении карты ${JSON.stringify(tCard)}`;
    console.log(error);
    return { success: false, message: error }
  }

  return { success: true, savedTCard: savedTCard }

}

// СТАДИИ
export async function updateStages(
  tCardStagesRepository: Repository<TCardStageTable>,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
  tCardStages: TCardStageItem[],
  savedTCard: TCardTable) {

  // СПИСОК СТАДИЙ  в базе
  const existingTCardStages = await tCardStagesRepository.find({ where: { tcard_id: savedTCard.id } });

  // 1. Найдём удалённые стадии
  const stagesToDelete = existingTCardStages.filter(stage =>
    !tCardStages.some(newStage => newStage.id === stage.id) // Сравниваем id существующих стадий с переданными
  );

  // 2. Найдём новые стадии, которых нет в базе
  const stagesToAdd = tCardStages.filter(stage =>
    !existingTCardStages.some(existingStage => existingStage.id === stage.id) // Сравниваем id переданных стадий с существующими
  );

  // 3. Найдём существующие стадии для обновления
  const stagesToUpdate = tCardStages.filter(stage =>
    existingTCardStages.some(existingStage => existingStage.id === stage.id) // Сравниваем id для существующих стадий
  );

  // Удаляем старые стадии
  if (stagesToDelete.length > 0) {
    // Для каждой стадии находим связанные с ней операции
    for (const stage of stagesToDelete) {
      // Получаем операции, связанные с текущей стадией
      const operationsToDelete = await tCardOperationsRepository.find({
        where: { stage_id: stage.id },
      });

      // Для каждой операции находим связанные с ней продукты
      for (const operation of operationsToDelete) {
        const productsToDelete = await tCardProductRepository
          .createQueryBuilder('product')
          .where('product.operation_id = :operationId', { operationId: operation.id })
          .getMany();

        // Удаляем продукты
        if (productsToDelete.length > 0) {
          await tCardProductRepository.remove(productsToDelete);
          console.log(`Удалено ${productsToDelete.length} продуктов для операции ${operation.id}`);
        }
      }

      // Удаляем операции
      if (operationsToDelete.length > 0) {
        await tCardOperationsRepository.remove(operationsToDelete);
        console.log(`Удалено ${operationsToDelete.length} операций для стадии ${stage.id}`);
      }
    }
    await tCardStagesRepository.remove(stagesToDelete);
  }

  // Добавляем новые стадии
  const newStages = stagesToAdd.map(stage => {
    return tCardStagesRepository.create({
      idc: stage.idc,
      code: stage.code,
      tcard_id: savedTCard.id,
    });
  });
  let savedNewStages = [] as TCardStageTable[]
  if (newStages.length > 0) savedNewStages = await tCardStagesRepository.save(newStages);
  if (!savedNewStages) return { success: false, message: "Не удалось сохранить стадии" }

  // Обновляем существующие стадии
  const updatedStages = stagesToUpdate.map(stage => {
    const existingStage = existingTCardStages.find(existingStage => existingStage.id === stage.id);
    if (existingStage) {
      existingStage.code = stage.code; // Обновляем нужные поля
      return tCardStagesRepository.create(existingStage);
    }
    return null;
  }).filter(stage => stage !== null);

  let savedUpdatedStages = [] as TCardStageTable[]
  if (updatedStages.length > 0) savedUpdatedStages = await tCardStagesRepository.save(updatedStages);
  if (!savedUpdatedStages) return { success: false, message: "Не удалось сохранить стадии" }

  // Все стадии сохранены, проверка
  const savedTCardStages = [...savedNewStages, ...savedUpdatedStages]
    .sort((a, b) => a.code - b.code) as TCardStageTable[];

  if (tCardStages.length > 0) {
    // Проверка, что массив не пуст и все объекты имеют сгенерированный id
    let error = ""
    if (savedTCardStages.length > 0) {

      savedTCardStages.forEach((stage, index) => {
        if (stage.id) {
          console.log(`Стадия ${index + 1} успешно сохранена с id: ${stage.id}`);
        } else {
          error = `Ошибка при сохранении стадии ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить стадии`;
      console.log(error);
      return { success: false, message: error }
    }
  }
  return { success: true, savedTCardStages: savedTCardStages }
}

// ОПЕРАЦИИ
export async function updateOperations(
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
  tCardOperations: TCardOperationItem[],
  savedTCard: TCardTable,
  savedTCardStages: TCardStageTable[] // Сохранённые стадии
) {

  // Получаем существующие операции для данного tCard
  const existingTCardOperations = await tCardOperationsRepository.find({
    where: { tcard_id: savedTCard.id },
  });

  // 1. Найдём удалённые операции
  const operationsToDelete = existingTCardOperations.filter(
    (operation) => !tCardOperations.some((newOperation) => newOperation.id === operation.id)
  );

  // 2. Найдём новые операции, которых нет в базе
  const operationsToAdd = tCardOperations.filter(
    (operation) => !existingTCardOperations.some((existingOperation) => existingOperation.id === operation.id)
  );

  // 3. Найдём существующие операции для обновления
  const operationsToUpdate = tCardOperations.filter(
    (operation) => existingTCardOperations.some((existingOperation) => existingOperation.id === operation.id)
  );


  // Удаляем старые операции
  // Перед этим надо удалить продукты, входящие в операцию
  const operationIds = operationsToDelete.map(op => op.id);

  // Если список операций пуст, пропускаем запрос
  if (operationIds.length > 0) {
    const productsToDelete = await tCardProductRepository
      .createQueryBuilder('product')
      .where('product.operation_id IN (:...operationIds)', { operationIds })
      .getMany();

    if (productsToDelete.length > 0) {
      // Удаляем продукты, связанные с этими операциями
      await tCardProductRepository.remove(productsToDelete);
      console.log(`Удалено ${productsToDelete.length} продуктов`);
    }
  }

  if (operationsToDelete.length > 0) {
    await tCardOperationsRepository.remove(operationsToDelete);
    console.log(`Удалено ${operationsToDelete.length} операций`);
  }

  let error = "";

  // Добавляем новые операции

  let newOperations = [];

  for (const operation of operationsToAdd) {
    const savedStage = savedTCardStages.find((stage) => stage.idc === operation.stage.idc);

    if (!savedStage) {
      error = `Ошибка при поиске стадии для операции С${operation.idc}`;
      console.log(error);
      break;  // Прерываем цикл
    }

    if (!operation.action.id) {
      error = `Ошибка, не заполнено действие в операции ${operation.idc}`;
      console.log(error);
      break;  // Прерываем цикл
    }
    newOperations.push(
      tCardOperationsRepository.create({
        idc: operation.idc,
        stage_id: savedStage.id,
        order: operation.order,
        action_id: operation.action.id,
        action: operation.action,
        duration: operation.duration,
        tcard_id: savedTCard.id,
        status: operation.status,
        coment: operation.coment,
        fix_oper_idc: operation.fixOperIdc,
      }));
  }

  if (error) {
    return { success: false, message: error };
  }

  let savedNewOperations = [] as TCardOperationTable[];;
  if (newOperations.length > 0) {
    savedNewOperations = await tCardOperationsRepository.save(newOperations);
  }


  // Обновляем существующие операции
  let updatedOperations = [] as TCardOperationTable[];

  for (const operation of operationsToUpdate) {
    const existingOperation = existingTCardOperations.find(
      (existingOperation) => existingOperation.id === operation.id
    );

    if (!existingOperation) {
      error = `Операция с id ${operation.id} не найдена`;
      console.log(error);
      break;  // Прерываем цикл
    }

    const savedStage = savedTCardStages.find((stage) => stage.idc === operation.stage.idc);
    if (!savedStage || !savedStage.id) {
      error = `Ошибка при поиске стадии для операции С${operation.idc}`;
      console.log(error);
      break;  // Прерываем цикл
    }

    if (!operation.action.id) {
      error = `Ошибка, не заполнено действие в операции ${operation.idc}`;
      console.log(error);
      break;  // Прерываем цикл
    }
    const operationToUpdate = {
      id: existingOperation.id,
      stage_id: savedStage.id,
      action_id: operation.action.id,
      order: operation.order,
      duration: operation.duration,
      status: operation.status,
      coment: operation.coment,
      fix_oper_idc: operation.fixOperIdc,
    } as TCardOperationTable;

    updatedOperations.push(operationToUpdate);
  }

  if (error) {
    return { success: false, message: error };
  }

  let savedUpdatedOperations = [] as TCardOperationTable[];
  if (updatedOperations.length > 0) {
    savedUpdatedOperations = await tCardOperationsRepository.save(updatedOperations); // сохраняем обновленные записи
  }

  // Извлекаем обновленные операции с их связанными таблицами (stage, tCard, action)
  const operIds = updatedOperations.map(op => op.id);
  savedUpdatedOperations = await tCardOperationsRepository.find({
    where: { id: In(operIds) },
    relations: ['stage', 'action', 'tcard']
  });

  // Все операции сохранены, проверка
  const savedTCardOperations = [...savedNewOperations, ...savedUpdatedOperations] as TCardOperationTable[];

  if (tCardOperations.length > 0) {
    let error = '';
    if (savedTCardOperations.length > 0) {
      savedTCardOperations.forEach((operation, index) => {
        if (operation.id) {
          console.log(`Операция ${index + 1} успешно сохранена с id: ${operation.id}`);
        } else {
          error = `Ошибка при сохранении операции ${index + 1}`;
          console.log(error);
          return { success: false, message: error };
        }
      });
    } else {
      error = `Не удалось сохранить операции`;
      console.log(error);
      return { success: false, message: error };
    }
  }
  return { success: true, savedTCardOperations: savedTCardOperations };
}

// ПРОДУКТЫ
// Расширяем тип TCardProductItem, чтобы добавить поле 'type' и operationId
interface TCardProductItemRecord extends TCardProductItem {
  type: TypeEnum;      // Добавляем поле 'type'
  operationId: number | null;  // Поле operationId
}

export async function updateProducts(
  tCardProductRepository: Repository<TCardProductTable>,
  savedTCard: TCardTable,
  savedTCardOperations: TCardOperationTable[],
  tCardProducts: TCardProductItem[],
  tCardMaterials: TCardProductItem[],
  tCardWastes: TCardProductItem[],
  tCardOperations: TCardOperationItem[]
) {
  let error = "";
  let outArr = [] as TCardProductItemRecord[];
  let innArr = [] as TCardProductItemRecord[];



  // Преобразуем tCardOperations в объект, где idc операции - это ключ
  const operationsMap = savedTCardOperations.reduce((acc, operation) => {
    acc[operation.idc] = operation.idc;  // Сопоставляем idc операции с id
    return acc;
  }, {} as Record<number, number>);

  // Собираем продукты из операций и добавляем operationId на этом этапе
  tCardOperations.forEach(toper => {
    // Продукты на выходе (с добавлением operationId)
    outArr = [...outArr, ...toper.out.map((product) => ({ ...product, type: TypeEnum.O, operationId: operationsMap[toper.idc] }))];

    // Продукты на входе (с добавлением operationId)
    innArr = [...innArr, ...toper.inn.map((product) => ({ ...product, type: TypeEnum.I, operationId: operationsMap[toper.idc] }))];
  });

  // // Убираю ID Записей БД  синхронизация идет по idc
  // const tCardMaterials_ = tCardMaterials.map(({ id, ...rest }) => rest);   
  // const tCardWastes_ = tCardWastes.map(({ id, ...rest }) => rest);   
  // const innArr_ = innArr.map(({ id, ...rest }) => rest);   
  // const outArr_ = outArr.map(({ id, ...rest }) => rest);  

  // Собираем все продукты в один массив
  const tCardAllProducts = [
    ...tCardProducts.map((product) => ({ ...product, type: TypeEnum.P, operationId: null })),    // Для заказанных предметов type: TypeEnum.P
    ...tCardMaterials.map((product) => ({ ...product, type: TypeEnum.M, operationId: null })), // Для материалов type: TypeEnum.M
    ...tCardWastes.map((product) => ({ ...product, type: TypeEnum.W, operationId: null })),    // Для отходов type: TypeEnum.W
    ...outArr,
    ...innArr
  ] as TCardProductItemRecord[];


  // Шаг 1: Получаем существующие продукты из базы данных
  const existingTCardProducts = await tCardProductRepository.find({ where: { tcard_id: savedTCard.id } });

  // 1. Найдем удаленные продукты
  const productsToDelete = existingTCardProducts.filter(product =>
    !tCardAllProducts.some(newProduct => {
      return (
        newProduct.id === product.id
        && newProduct.code === product.code
        && newProduct.idc === product.idc
        && newProduct.type === product.type
        && newProduct.qtu === product.qtu
        && newProduct.uom.id === product.uom.id)
    }) // Сравниваем id существующих продуктов с переданными
  );

  // 2. Найдем новые продукты, которых нет в базе
  const productsToAdd = tCardAllProducts.filter(product =>
    !existingTCardProducts.some(existingProduct => {
      return (
        existingProduct.id === product.id
        && existingProduct.code === product.code
        && existingProduct.type === product.type
        && existingProduct.idc === product.idc
        && existingProduct.qtu === product.qtu
        && existingProduct.uom.id === product.uom.id)
    })
  );

  // 3. Найдем существующие продукты для обновления
  const productsToUpdate = tCardAllProducts.filter(product =>
    existingTCardProducts.some(existingProduct => {
      return (
        existingProduct.id === product.id
        && existingProduct.code === product.code
        && existingProduct.type === product.type
        && existingProduct.idc === product.idc
        && existingProduct.qtu === product.qtu
        && existingProduct.uom.id === product.uom.id)
    })
  );

  // Удаляем старые продукты
  if (productsToDelete.length > 0) await tCardProductRepository.remove(productsToDelete);


  // Добавляем новые продукты
  const newProducts = productsToAdd.map(product => {
    const opertab = savedTCardOperations.find(opertab => opertab.idc === product.operationId);
    return tCardProductRepository.create({
      idc: product.idc,
      code: product.code,
      type: product.type,
      title: product.title,
      qtu: product.qtu,
      uom_id: product.uom.id,
      operation: opertab ? opertab : null,
      operation_id: opertab ? opertab.id : null,
      tcard_id: savedTCard.id,
      uom: product.uom
    });
  });

  let savedNewProducts = [] as TCardProductTable[];
  if (newProducts.length > 0) {
    savedNewProducts = await tCardProductRepository.save(newProducts);
    if (!savedNewProducts) return { success: false, message: "Не удалось сохранить продукты" };
  }


  // Обновляем существующие продукты
  const updatedProducts = productsToUpdate.map(product => {
    const existingProduct = existingTCardProducts.find(existingProduct => existingProduct.id === product.id);
    if (existingProduct) {
      existingProduct.code = product.code; // Обновляем нужные поля
      existingProduct.title = product.title;
      existingProduct.qtu = product.qtu;
      existingProduct.uom_id = product.uom.id;
      existingProduct.operation_id = product.operationId;
      return tCardProductRepository.create(existingProduct);
    }
    return null;
  }).filter(product => product !== null);

  let savedUpdatedProducts = [] as TCardProductTable[];
  if (updatedProducts.length > 0) {
    savedUpdatedProducts = await tCardProductRepository.save(updatedProducts);
    if (!savedUpdatedProducts) return { success: false, message: "Не удалось сохранить продукты" };
  }

  // Все продукты сохранены, проверка
  const savedTCardProducts = [...savedNewProducts, ...savedUpdatedProducts] as TCardProductTable[];

  // если изначально был пустой массив продуктов уходим
  if (tCardAllProducts.length === 0) return { success: true, savedTCardProducts: savedTCardProducts };

  // если изначально был НЕ пустой массив продуктов  проверка
  if (savedTCardProducts.length > 0) {
    savedTCardProducts.forEach((product, index) => {
      if (product.id) {
        console.log(`Продукт ${index + 1} успешно сохранен с id: ${product.id}`);
      } else {
        error = `Ошибка при сохранении продукта ${index + 1}`;
        console.log(error);
        return { success: false, message: error };
      }
    });
  } else {
    error = `Не удалось сохранить продукты`;
    console.log(error);
    return { success: false, message: error };
  }

  return { success: true, savedTCardProducts: savedTCardProducts };
}

///////////////////// СТАТУСЫ//////////////////

export async function updateStatusOperationByTCardId(
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

  } catch (error: any) {
    console.error("Ошибка обновления операций:", error);
    return { success: false, message: error.message || "Ошибка обновления операций" };
  }
}


export async function updateStatusOperationByOperId(
  tCardOperationsRepository: Repository<TCardOperationTable>,
  operId: number,
  status: StatusEnum
): Promise<{ success: boolean, message: string }> {
  try {
    const result = await tCardOperationsRepository.update(operId, { status });
    if (result.affected && result.affected > 0) {
      return { success: true, message: "Операция успешно обновлена" };
    } else {
      return { success: false, message: "Операция не обновлена" };
    }
  } catch (error: any) {
    console.error("Ошибка обновления операции:", error);
    return { success: false, message: error.message || "Ошибка обновления операции" };
  }
}

export async function updateStatusOperationsByOperIds(
  tCardOperationsRepository: Repository<TCardOperationTable>,
  opersIds: number[],
  status: StatusEnum
): Promise<{ success: boolean, message?: string }> {

  if (opersIds.length === 0) return { success: true };

  try {
    const updateResult = await tCardOperationsRepository.update(
      { id: In(opersIds) },
      { status }
    );

    if (updateResult.affected && updateResult.affected > 0) {
      // console.log('Операции успешно обновлены:', opersIds);
      return { success: true };
    } else {
      const error = `Ошибка: операции с id ${JSON.stringify(opersIds)} не найдены или не обновлены.`;
      // console.error(error);
      return { success: false, message: error };
    }
  } catch (error: any) {
    // console.error("Ошибка при обновлении операций:", error);
    return { success: false, message: error.message || "Ошибка при обновлении операций." };
  }
}



// Функция для обновления статусов загрузок
export async function updateStatusLoads(
  unitLoadRepository: Repository<UnitLoadTable>,
  loadsIds: number[],
  status: StatusEnum
): Promise<{ success: boolean, message: string }> {
  try {

    if (loadsIds.length === 0) {
      return { success: false, message: "Нет загрузок для обновления" };
    }

    const result = await unitLoadRepository
      .createQueryBuilder()
      .update(UnitLoadTable)
      .set({ status })
      .where("id IN (:...loadsIds)", { loadsIds })
      .execute();



    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлено ${result.affected} загрузок` };
    } else {
      return { success: false, message: "Ни одна загрузка не обновлена" };
    }
  } catch (error: any) {
    console.error("Ошибка обновления статусов загрузок:", error);
    return { success: false, message: error.message || "Ошибка обновления статусов загрузок" };
  }
}

// Функция для обновления статуса карты
export async function updateStatusTCard(
  tCardRepository: Repository<TCardTable>,
  tCardId: number, // Один id карты
  status: StatusEnum
): Promise<{ success: boolean, message: string }> {
  try {
    // Обновление статуса карты с заданным tCardId
    const result = await tCardRepository
      .createQueryBuilder()
      .update(TCardTable)
      .set({ status }) // Устанавливаем новый статус
      .where("id = :tCardId", { tCardId }) // Используем правильный синтаксис для одного id
      .execute();

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлена карта с id: ${tCardId}` };
    } else {
      return { success: false, message: "Не удалось обновить карту" };
    }
  } catch (error: any) {
    console.error("Ошибка обновления статуса карты:", error);
    return { success: false, message: error.message || "Ошибка обновления статуса карты" };
  }
}
