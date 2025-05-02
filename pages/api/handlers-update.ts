
import { Repository, In, Any } from 'typeorm';
// tables
import { UnitTable } from '@/pages/db/models/catalogs/units'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';
import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TypeEnum } from '@/pages/db/models/enums';
import { ActionTable } from '@/pages/db/models/catalogs/actions';
import { UOMsTable } from '@/pages/db/models/catalogs/uoms';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions';
import { TeamScheduleTable } from '@/pages/db/models/plan/team_schedule';
import { SettingsTable } from '@/pages/db/models/plan/settings';

import { UserTable } from '@/pages/db/models/catalogs/users';
import { UserUnitTable } from '@/pages/db/models/catalogs/user_unit';



// types
import { UnitItem, UserItem, UnitLoadItem, UnitActionItem, UnitBelongEnum, UnitTypeEnum, UnitExceptionItem, TimeTypeEnum, DaysOfWeek, TimeZoneEnum, TCardOperationTermsItem } from '@/types';
import { TCardItem, TCardOperationItem, TCardProductItem, UserUnitItem, TCardStageItem, ActionItem, UOMItem, ScheduleItem, SettingsItem, TCardTermsItem } from '@/types';


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