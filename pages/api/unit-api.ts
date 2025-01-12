import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { UnitTable } from '@/pages/db/models/catalogs/units'

import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'


import { UnitItem, UnitActionItem } from '@/types';
import { Action } from 'redux';
import { ActionTable } from '../db/models/catalogs/actions';

interface RequestBody {
  unit: UnitItem;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(CompanyTable);
    const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);

    // userId, companyId в любом случае
    const { userId, companyId } = req.query;

    switch (req.method) {
      case 'GET':

        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          unit: {} as UnitItem,
        });
        break;

      case 'POST':

        // Извлекаем данные из тела запроса
        const { unit } = req.body as RequestBody;
        const unitActions = unit.actions as UnitActionItem[]


        // ЮНИТ
        const resUnit = await updateUnit(unitRepository, unit, Number(userId), Number(companyId))

        if (!resUnit.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUnit.message });
          return;
        }
        const savedUnit = resUnit.savedUnit as UnitTable;

        // СПИСОК ДЕЙСТВИЙ ЮНИТА

        const resUnitActions = await updateUnitActions(
          unitActionsRepository,
          unitActions,
          savedUnit)
        if (!resUnitActions.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUnitActions.message });
          return;
        }

        const savedUnitActions = resUnitActions.savedUnitActions as UnitActionTable[];

        const unitActions_ = savedUnitActions
        .map(unitAction => { return { 
          id: unitAction.id, 
          action: unitAction.action, 
          koef: unitAction.koef, 
          }; });

        // если дошли сюда значит при сохранении ничего не слетело 
        //  преобразуем  записи таблиц в наши типы но только с указанием id базы

        // savedUnitActions.map()

        const unit_ = {
          id: savedUnit.id,
          title: savedUnit.title,
          code: savedUnit.code,
          actions: unitActions_,
          retool: savedUnit.retool,
          modified: false,
          belong: savedUnit.belong,
          type: savedUnit.type,
          coment: savedUnit.coment
        }


        // отправляем ответ
        res.status(200).json({
          success: true,
          unit: unit_,
        });
        break;



      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса:', error);
    res.status(500).json({ error: 'Не удалось обработать запрос'+ error});
  }
}

// ЮНИТ
async function updateUnit(unitRepository: Repository<UnitTable>, unit: UnitItem, userId: number, companyId: number) {
  let savedUnit = null;
  let error = "";


  // Если id карты положительный, то обновляем, если нет - создаем новую
  if (unit.id && unit.id > 0) {
    // Обновляем существующую карту
    savedUnit = await unitRepository.save({
      ...unit,  // сохраняем все поля карты, включая id     
      company_id: Number(companyId),
      title: unit.title,
      code: unit.code,
      retool: unit.retool,
      coment: unit.coment,
      belong: unit.belong,
      type: unit.type
    });
    console.log('Юнит успешно обновлен с id:', savedUnit.id);
  } else {
    // Создаем новую карту
    const newUnit = unitRepository.create({
      company_id: Number(companyId),
      title: unit.title,
      code: unit.code,
      retool: unit.retool,
      coment: unit.coment,
      belong: unit.belong,
      type: unit.type
    });

    savedUnit = await unitRepository.save(newUnit);
    console.log('Новый юнит успешно сохранен с id:', savedUnit.id);
  }

  // Проверка, что сохранение прошло успешно
  if (savedUnit && savedUnit.id) {
    console.log('Юнит успешно сохранен или обновлена с id:', savedUnit.id);
  } else {
    error = `Ошибка при сохранении или обновлении юнита ${JSON.stringify(unit)}`;
    console.log(error);
    return { success: false, message: error }
  }

  return { success: true, savedUnit: savedUnit }

}

// ДЕЙСТВИЯ ЮНИТА
async function updateUnitActions(
  unitActionsRepository: Repository<UnitActionTable>,
  unitActions: UnitActionItem[],
  savedUnit:  UnitTable,  
) {

  // СПИСОК ЮНИТОВ в базе
  const existingUnitActions = await unitActionsRepository.find({ where: { unit_id: savedUnit.id } });

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
      koef: unitAction.koef,
      action_id: unitAction.action.id,
      action:unitAction.action,
      unit_id: savedUnit.id,
      unit:savedUnit,
    });
  });
  let savedNewUnitActions = [] as UnitActionTable[]
  if (newUnitAction.length > 0) savedNewUnitActions = await unitActionsRepository.save(newUnitAction);
  if (!savedNewUnitActions) return { success: false, message: "Не удалось сохранить действия Юнита" }

  // Обновляем существующие стадии
  const updatedUnitActions = unitActionToUpdate.map(unitAction => {
    const existingUnitAction = existingUnitActions.find(existingUnitAction => existingUnitAction.id === unitAction.id);
    if (existingUnitAction) {
      existingUnitAction.koef = unitAction.koef; // Обновляем нужные поля
      existingUnitAction.action_id = unitAction.action.id;
      return unitActionsRepository.create(existingUnitAction);
    }
    return null;
  }).filter(unitAction => unitAction !== null);

  let savedUpdatedUnitActions = [] as UnitActionItem[]
  if (updatedUnitActions.length > 0) savedUpdatedUnitActions = await unitActionsRepository.save(updatedUnitActions);
  if (!savedUpdatedUnitActions) return { success: false, message: "Не удалось сохранить действия Юнита" }

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