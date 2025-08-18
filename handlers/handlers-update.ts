
import { Repository, In } from 'typeorm';
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

import { UserTable } from './../db/models/catalogs/users';
import { UserUnitTable } from './../db/models/catalogs/user_unit';
import { SupportTable } from './../db/models/support/support';



// types
import {
  UnitItem, UserItem, UnitLoadItem, UnitActionItem, UnitExceptionItem,
  SupportMessageItem, TCardItem, TCardOperationItem, TCardProductItem,
  ProductItem, UserUnitItem, TCardStageItem, ActionItem, UOMItem,
  SettingsItem, TemplateItem, StatusEnum, UnitBelongEnum, UnitTypeEnum
} from './../types/types';
import { getUOMs } from './handlers-get';


// НАСТРОЙКИ
export async function updateSettings(
  settingsRepository: Repository<SettingsTable>,
  settings: SettingsItem,
  teamId: number
) {

  // Получаем существующее расписание для компании (предполагается, что только одно расписание для компании)
  const existingSetting = await settingsRepository.findOne({ where: { team_id: teamId } });

  if (!existingSetting) {
    // Если расписания нет, создаем новое
    const newSettings = settingsRepository.create({
      // team: { id: teamId }, 
      team_id: teamId,
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
      existingAction.code = action.code;
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

// &&&&&
// ЮНИТЫ
export async function updateUnits(
  unitRepository: Repository<UnitTable>,
  units: UnitItem[],
  teamId: number
): Promise<{ success: boolean, savedUnits?: UnitItem[], message?: string }> {

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
}

// &&&&&
// ДЕЙСТВИЯ ЮНИТА
export async function updateUnitActions(
  unitActionsRepository: Repository<UnitActionTable>,
  unitActions: UnitActionItem[],
  teamId: number
): Promise<{ success: boolean; message?: string; savedUnitActions?: UnitActionItem[] }> {
  const existingUnitActions = await unitActionsRepository.find({
    where: { team_id: teamId }
  });

  const unitActionToDelete = existingUnitActions.filter(existing =>
    !unitActions.some(u => u.id === existing.id)
  );

  const unitActionToAdd = unitActions.filter(u =>
    !existingUnitActions.some(existing => existing.id === u.id)
  );

  const unitActionToUpdate = unitActions.filter(u =>
    existingUnitActions.some(existing => existing.id === u.id)
  );

  if (unitActionToDelete.length > 0) {
    await unitActionsRepository.remove(unitActionToDelete);
  }

  const newUnitActionEntities = unitActionToAdd.map(unitAction =>
    unitActionsRepository.create({
      idc: unitAction.idc,
      koef: unitAction.koef,
      action_id: unitAction.action.id,
      unit_id: unitAction.unitId,
      unit_idc: unitAction.unitIdc,
      team_id: teamId,
    })
  );

  const savedNewUnitActions = newUnitActionEntities.length > 0
    ? await unitActionsRepository.save(newUnitActionEntities)
    : [];

  const updatedEntities = unitActionToUpdate.map(unitAction => {
    const existing = existingUnitActions.find(e => e.id === unitAction.id);
    if (existing) {
      return unitActionsRepository.create({
        id: unitAction.id,
        idc: unitAction.idc,
        koef: unitAction.koef,
        action_id: unitAction.action.id,
        unit_id: unitAction.unitId,
        unit_idc: unitAction.unitIdc,
        team_id: teamId,
      });
    }
    return null;
  }).filter(Boolean) as UnitActionTable[];

  const savedUpdatedUnitActions = updatedEntities.length > 0
    ? await unitActionsRepository.save(updatedEntities)
    : [];

  const savedUnitActions = [...savedNewUnitActions, ...savedUpdatedUnitActions].map(unitAction => ({
    ...unitAction,
    action: unitActions.find(u => u.id === unitAction.id)?.action
  })) as (UnitActionTable & { action?: ActionTable })[];

  if (savedUnitActions.length > 0 && unitActions.length !== savedUnitActions.length) {
    const error = `Не удалось сохранить действия юнита`;
    console.log(error);
    return { success: false, message: error };
  }

  for (const [index, unitAction] of savedUnitActions.entries()) {
    if (!unitAction.id) {
      const error = `Ошибка при сохранении действия юнита ${index + 1}`;
      console.log(error);
      return { success: false, message: error };
    }
  }
  const savedUnitActions_ = savedUnitActions.map(uasaved => {
    const unitAction = unitActions.find(ua => ua.idc === uasaved.idc)
    return {
      id: uasaved.id,
      idc: uasaved.idc,
      action: unitAction?.action ?? {} as ActionItem,
      koef: uasaved.koef,
      unitId: uasaved.unit_id,
      unitIdc: uasaved.unit_idc,
    } as UnitActionItem
  })
  return { success: true, savedUnitActions: savedUnitActions_ };
}
// &&&&
// ОТКЛОНЕНИЯ ОТ РАСПИСАНИЯ ЮНИТА
export async function updateExceptions(
  unitExceptionsRepository: Repository<UnitExceptionTable>,
  unitExceptions: UnitExceptionItem[],
  teamId: number
): Promise<{ success: boolean; message?: string; savedUnitExceptions?: UnitExceptionItem[] }> {

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
    const date = new Date(unitException.date);
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
          // console.log(`Отклонение юнита ${index + 1} успешно сохранено с id: ${unitException.id}`);
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
  const savedUnitExceptions_ = savedUnitExceptions.map(sue => {
    return {
      id: sue.id,
      idc: sue.idc,
      date: new Date(sue.date).toLocaleDateString('en-CA'),
      type: sue.type,
      timeStart: sue.timeStart,
      timeFinish: sue.timeFinish,
      unitId: sue.unit_id,
      unitIdc: sue.unit_idc,
    } as UnitExceptionItem
  })
  return { success: true, savedUnitExceptions: savedUnitExceptions_ }
}

// НАЗНАЧЕНИЯ ЮНИТА ПОЛЬЗОВАТЕЛЮ
export async function updateUsersUnits(
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

///////////////////// ЗАПИСЬ КАРТЫ//////////////////
// &&&&
// ТКАРТА  //  ПРОВЕРИТЬ ПРИ ЗАПИСИ ПРАВИЛЬНОСТЬ СТАТУСА (если есть БРАК!!
export async function updateCard(
  tCardRepository: Repository<TCardTable>,
  tCard: TCardItem,
  userId: number,
  teamId: number
): Promise<{ success: boolean; savedTCard?: TCardItem; message?: string }> {
  let savedTCard: TCardTable | null = null;

  try {
    // Генерируем номер карты, если idc = 0
    let newCardNumber = Number(tCard.idc);
    if (tCard.idc === 0) {
      newCardNumber = await generateNewNumberForTeam(tCardRepository);
      if (!newCardNumber) {
        return { success: false, message: `Ошибка при генерации номера карты` };
      }
    }
    // проверка если есть брак и нет исправления то у карты статус брак  (если она приходит со статусом брак, планирован, подготовлен и драфт)
    const opDefective = tCard.tCardOperations?.filter(op => op.status === StatusEnum.defective);

    const hasUnfixedDefect = opDefective?.some(op => {
      const fix = tCard.tCardOperations?.find(op1 => op1.fixOperIdc === op.idc);
      return !fix; // true, если исправления нет
    });

    if (hasUnfixedDefect && 
      (tCard.status === StatusEnum.draft 
      || tCard.status === StatusEnum.planed
      || tCard.status === StatusEnum.prepared) ) {
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

    // Проверка успешности
    if (!savedTCard || !savedTCard.id) {
      return { success: false, message: `Ошибка при сохранении карты` };
    }

    // Формируем TCardItem
    const savedItem: TCardItem = {
      id: savedTCard.id,
      date: new Date(savedTCard.date).toLocaleDateString("en-CA"),
      idc: savedTCard.idc,
      modified: false,
      maxIdc: savedTCard.max_idc,
      coment: savedTCard.coment,
      status: savedTCard.status
    };

    return { success: true, savedTCard: savedItem };

  } catch (error) {
    console.error('Ошибка при обновлении/создании карты:', error);
    return { success: false, message: 'Ошибка при сохранении карты' };
  }
}
// &&&&
// СТАДИИ
export async function updateStages(
  tCardStagesRepository: Repository<TCardStageTable>,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
  tCardStages: TCardStageItem[],
  savedTCard: TCardItem,
   teamId:number
): Promise<{ success: boolean, savedTCardStages?: TCardStageItem[], message?: string }> {
  try {
    // Получаем текущие стадии из БД
    const existingTCardStages = await tCardStagesRepository.find({
      where: { tcard_id: savedTCard.id },
    });

    // 1. Удаляем удалённые стадии и связанные данные
    const stagesToDelete = existingTCardStages.filter(stage =>
      !tCardStages.some(newStage => newStage.id === stage.id)
    );

    if (stagesToDelete.length > 0) {
      for (const stage of stagesToDelete) {
        // Операции для стадии
        const operationsToDelete = await tCardOperationsRepository.find({ where: { stage_id: stage.id } });

        if (operationsToDelete.length > 0) {
          // Удаляем продукты для операций
          const operationIds = operationsToDelete.map(op => op.id);
          const productsToDelete = await tCardProductRepository
            .createQueryBuilder('product')
            .where('product.operation_id IN (:...operationIds)', { operationIds })
            .getMany();

          if (productsToDelete.length > 0) {
            await tCardProductRepository.remove(productsToDelete);
            console.log(`Удалено ${productsToDelete.length} продуктов для стадии ${stage.id}`);
          }

          await tCardOperationsRepository.remove(operationsToDelete);
          console.log(`Удалено ${operationsToDelete.length} операций для стадии ${stage.id}`);
        }
      }
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

    // 3. Обновляем существующие стадии
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

    // 4. Объединяем результат
    const savedTCardStages = [...savedNewStages, ...savedUpdatedStages]
      .sort((a, b) => a.code - b.code)
      .map(stage => ({
        id: stage.id,
        idc: stage.idc,
        code: stage.code,
      } as TCardStageItem));

    // Проверка корректности
    if (tCardStages.length > 0 && savedTCardStages.length === 0) {
      return { success: false, message: 'Не удалось сохранить стадии' };
    }

    return { success: true, savedTCardStages };

  } catch (error) {
    console.error('Ошибка при обновлении стадий:', error);
    return { success: false, message: 'Ошибка при обновлении стадий' };
  }
}
// &&&&
// ОПЕРАЦИИ
export async function updateOperations(
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
      if (!savedStage || !op.action.id) return null;

      return tCardOperationsRepository.create({
        idc: op.idc,
        stage_id: savedStage.id,
        order: op.order,
        action_id: op.action.id,
        duration: op.duration,
        tcard_id: savedTCard.id,
        status: op.status,
        coment: op.coment,
        fix_oper_idc: op.fixOperIdc,
        team_id: teamId, // Добавляем team_id
      });
    }).filter(Boolean) as TCardOperationTable[];

    const savedNewOperations = newOperations.length
      ? await tCardOperationsRepository.save(newOperations)
      : [];

    // Обновляем существующие операции
    const updatedOperations = operationsToUpdate.map(op => {
      const existingOperation = existingTCardOperations.find(eo => eo.id === op.id);
      const savedStage = savedTCardStages.find(stage => stage.idc === op.stage.idc);

      if (!existingOperation || !savedStage || !op.action.id) return null;

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
  } catch (error) {
    console.error('Ошибка при обновлении операций:', error);
    return { success: false, message: 'Ошибка при обновлении операций' };
  }
}
// &&&&
// ПРОДУКТЫ
export async function updateProducts(
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
      const product = products.find(p => p.idc === tp.product.idc);
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
    // Проверка результата
    if (savedTCardProducts.length === 0 && tCardAllProducts.length > 0) {
      return { success: false, message: "Не удалось сохранить продукты" };
    }

    savedTCardProducts.forEach((tp, index) => {
      if (!tp.id) console.warn(`Ошибка при сохранении продукта ${index + 1}`);
    });

    return { success: true, savedTCardProducts };

  } catch (err) {
    console.error("Ошибка в updateProducts:", err);
    return { success: false, message: "Ошибка при обновлении продуктов" };
  }
}

// КАТАЛОГ
export async function updateCatalogProducts(
  
  productRepository: Repository<ProductTable>,
  savedTCard: TCardItem,
  products: ProductItem[],
  teamId: number
): Promise<{ success: boolean; savedProducts?: ProductItem[], message?: string }> {
  let error = "";

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
    try {
      const plainProducts = productsToAdd.map(p => ({
        idc: p.idc,
        title: p.title,
        uom_id: p.uom.id,
        tcard_id: savedTCard.id,
        sync: p.sync,
        team_id:teamId
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
    } catch (err) {
      console.error('Ошибка при сохранении новых продуктов:', err);
      return { success: false, message: 'Ошибка при сохранении продуктов каталога' };
    }
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

  if (savedProducts.length === 0) {
    error = `Не удалось сохранить каталог`;
    console.log(error);
    return { success: false, message: error };
  }

  savedProducts.forEach((product, index) => {
    if (!product.id) {
      error = `Ошибка при сохранении продукта ${index + 1}`;
      console.log(error);
    }
  });

  if (error) return { success: false, message: error };

  return { success: true, savedProducts };
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
    // } catch (error: any) {
    //   console.error("Ошибка обновления операции:", error);
    //   return { success: false, message: error.message || "Ошибка обновления операции" };
    // }
  } catch (error: unknown) {
    let message = "Ошибка обновления операции";
    if (error instanceof Error) {
      message = error.message;
      console.error("Ошибка обновления операции:", error);
    } else {
      console.error("Неизвестная ошибка обновления операции:", error);
    }
    return { success: false, message };
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
    // } catch (error: any) {
    //   // console.error("Ошибка при обновлении операций:", error);
    //   return { success: false, message: error.message || "Ошибка при обновлении операций." };
    // }
  } catch (error: unknown) {
    let message = "Ошибка при обновлении операций.";
    if (error instanceof Error) {
      message = error.message;
      console.error("Ошибка при обновлении операций:", error);
    }
    return { success: false, message };
  }

}


// // Функция для обновления статусов загрузок (интервалов)
// export async function updateStatusLoads(
//   unitLoadRepository: Repository<UnitLoadTable>,
//   loadsIds: number[],
//   status: StatusEnum
// ): Promise<{ success: boolean, message: string }> {
//   try {

//     if (loadsIds.length === 0) {
//       return { success: false, message: "Нет загрузок для обновления" };
//     }

//     const result = await unitLoadRepository
//       .createQueryBuilder()
//       .update(UnitLoadTable)
//       .set({ status })
//       .where("id IN (:...loadsIds)", { loadsIds })
//       .execute();



//     if (result.affected && result.affected > 0) {
//       return { success: true, message: `Обновлено ${result.affected} загрузок` };
//     } else {
//       return { success: false, message: "Ни одна загрузка не обновлена" };
//     }   
//   } catch (error: unknown) {
//     let message = "Ошибка обновления статусов загрузок";
//     if (error instanceof Error) {
//       message = error.message;
//       console.error("Ошибка обновления статусов загрузок:", error);
//     } else {
//       console.error("Неизвестная ошибка обновления статусов загрузок:", error);
//     }
//     return { success: false, message };
//   }

// }

// Функция для обновления статусов загрузок (интервалов)
export async function updateStatusLoads(
  unitLoadRepository: Repository<UnitLoadTable>,
  loadsIds: number[],
  status: StatusEnum
): Promise<{ success: boolean; message: string }> {
  try {
    if (loadsIds.length === 0) {
      return { success: false, message: "Нет загрузок для обновления" };
    }

    const result = await unitLoadRepository.update(
      loadsIds,
      { status }
    );

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлено ${result.affected} загрузок` };
    } else {
      return { success: false, message: "Ни одна загрузка не обновлена" };
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка обновления статусов загрузок";
    console.error("Ошибка обновления статусов загрузок:", error);
    return { success: false, message };
  }
}


// Функция для обновления статуса карты
export async function updateStatusTCard(
  tCardRepository: Repository<TCardTable>,
  tCardId: number,
  status: StatusEnum
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await tCardRepository.update(tCardId, { status });

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлен статус карты с id: ${tCardId}` };
    } else {
      return { success: false, message: `Не удалось обновить статус карты с id: ${tCardId}` };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка обновления статуса карты";
    console.error("Ошибка обновления статуса карты:", error);
    return { success: false, message };
  }
}

///////////////////// SUPPORT //////////////////

// Функция для обновления сообщения тех поддержки
export async function updateSupportMessage(
  teamId: number,
  userId: number,
  supportMessage: SupportMessageItem,
  supportRepository: Repository<SupportTable>
): Promise<{ success: boolean, message: string, savedMessage: SupportTable }> {
  try {
    // Создание нового сообщения для базы данных
    const newSupportMessage = supportRepository.create({
      date: supportMessage.date,
      title: supportMessage.title,
      body: supportMessage.body,
      fromUser: supportMessage.fromUser,
      basedOn: supportMessage.basedOn,
      user_id: userId,
      team_id: teamId,
    });

    // Сохраняем новое сообщение в базе данных
    const savedMessage = await supportRepository.save(newSupportMessage);

    // Если сообщение сохранено успешно, возвращаем его с ID
    return {
      success: true,
      message: "Сообщение успешно сохранено.",
      savedMessage: savedMessage,

    };
    // } catch (error: any) {
    //   console.error("Ошибка при сохранении сообщения:", error);
    //   return {
    //     success: false,
    //     message: error.message || "Ошибка при сохранении сообщения.",
    //     savedMessage: {} as SupportTable,      
    //   };
    // }
  } catch (error: unknown) {
    let message = "Ошибка при сохранении сообщения.";
    if (error instanceof Error) {
      message = error.message;
      console.error("Ошибка при сохранении сообщения:", error);
    } else {
      console.error("Неизвестная ошибка при сохранении сообщения:", error);
    }
    return {
      success: false,
      message,
      savedMessage: {} as SupportTable,
    };
  }

}
