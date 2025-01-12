import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения

import { ActionTable } from '@/pages/db/models/catalogs/actions';
import { Repository } from 'typeorm';
import { ActionItem } from '@/types';

interface RequestBody {
  actions: ActionItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const actionsRepository = dbConnection.getRepository(ActionTable);

    // userId, companyId в любом случае
    const { userId, companyId } = req.query;

    switch (req.method) {
      case 'GET':
        // Строим фильтр для поиска
        const filter: any = {};
        if (companyId) {
          filter.company_id = companyId;
        }

        // Выполняем запрос с фильтрацией
        const receivedActions = await actionsRepository.find({
          where: filter,  // Применяем фильтр к запросу
        });
        console.log(receivedActions);

        const actions__ = receivedActions
          .map(action => {
            return {
              id: action.id,
              title: action.title,
            };
          });

        // отправляем ответ
        res.status(200).json({
          success: true,
          actions: actions__,
        });

        break;

      case 'POST':
        // Извлекаем данные из тела запроса
        const { actions } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resActions = await updateActions(
          actionsRepository,
          actions,
          Number(companyId)
        )
        if (!resActions.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resActions.message });
          return;
        }

        const savedActions = resActions.savedActions as ActionTable[];

        const actions_ = savedActions
          .map(action => {
            return {
              id: action.id,
              title: action.title,
            };
          });

        // отправляем ответ
        res.status(200).json({
          success: true,
          actions: actions_,
        });
        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса:', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}



// ДЕЙСТВИЯ
async function updateActions(
  actionsRepository: Repository<ActionTable>,
  actions: ActionItem[],
  company_id: number
) {

  // СПИСОК ДЕЙСТВИЙ в базе
  const existingActions = await actionsRepository.find({ where: { company_id: company_id } });

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
      title: action.title,
      company_id: company_id,
    });
  });
  let savedNewActions = [] as ActionTable[]
  if (newAction.length > 0) savedNewActions = await actionsRepository.save(newAction);
  if (!savedNewActions) return { success: false, message: "Не удалось сохранить действие" }


  // Обновляем существующие стадии
  const updatedActions = actionToUpdate.map(action => {
    const existingAction = existingActions.find(existingAction => existingAction.id === action.id);
    if (existingAction) {
      existingAction.title = action.title; // Обновляем нужные поля

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