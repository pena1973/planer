
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnits, getUnitLoads } from './handlers';  // расчеты
import { planTCard } from './plan-handlers';  // планирование карты
import { getTCard, getTCardMatOper } from './handlers';  // 


import { Repository, In } from 'typeorm';

import { UnitLoadTable } from '@/pages/db/models/plan/unit-loads';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit-exceptions';
import { CompanyScheduleTable } from '@/pages/db/models/plan/company-calendar';
import { TCardTable } from '@/pages/db/models/data/t_cards'

import { UnitTable } from '@/pages/db/models/catalogs/units'
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'


import {
  UnitActionItem, TCardProductItem, TCardOperationItem,
  TCardItem, UnitLoadItem,
  UnitBelongEnum, UnitTypeEnum,
  CalendarItem, TimeTypeEnum, 
} from "@/types";

interface RequestBody {
  unitLoads: UnitLoadItem[];  // переобозвать и сделать плоскую таблицу
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDb();
  // Убедимся, что подключение установлено    
  const dbConnection = await connectDb();  // Получаем подключение

  const unitRepository = dbConnection.getRepository(UnitTable);
  const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
  const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
  const tCardRepository = dbConnection.getRepository(TCardTable);
  const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
  const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);


  // const unitCalendarRepository = dbConnection.getRepository(UnitCalendarTable);

  // userId, companyId в любом случае
  const { userId, companyId, tcardId } = req.query;

  switch (req.method) {
    // ПРЕДВАРИТЕЛЬНОЕ ПЛАНИРОВАНИЕ
    case 'GET':
      // получаем карту из базы  по id  со всеми параметрами    
      let tCard = {} as TCardItem;

      let tCard_ = await getTCard(Number(tcardId), tCardRepository)
      if (!tCard_) {
        res.status(200).json({ success: false, error: "Карта с таким номером не найдена" });
        return
      }

      let { tCardMaterials, tCardOperations } = await getTCardMatOper(
        Number(tcardId), tCardOperationsRepository, tCardProductRepository)

      tCard = { ...tCard_ } as TCardItem
      tCard.tCardMaterials = [...tCardMaterials] as TCardProductItem[];
      tCard.tCardOperations = [...tCardOperations] as TCardOperationItem[]

      // запросим юниты
      const units_ = await getUnits(Number(companyId), unitRepository, unitActionsRepository)

      //  получим юниты с загрузкой  до планирования новой карты   
      //   UnitLoadItem
      const unitLoadItems = await getUnitLoads(units_, unitLoadRepository)

      // Планируем карту
      let unitLoads_ = planTCard(tCard,units_, unitLoadItems)
      //  Если не удалось запланировать
      if (!unitLoads_) {
        res.status(200).json({
          success: false,
          unitsLoads: undefined,
        });
        break;
      }


      // Отправляем ответ с данными  в базе их нет это только драфт
      res.status(200).json({
        success: true,
        unitsLoads: unitLoads_,
      });
      break;

    // ЗАПИСЬ ЗАПЛАНИРОВАННОЙ КАРТЫ
    case 'POST':
      const { unitLoads } = req.body as RequestBody; //  загрузки по карте массив интервалов

      // СПИСОК ДЕЙСТВИЙ 
      const resLoads = await updateLoads(
        unitLoadRepository,
        unitLoads,
        Number(companyId)
      )
      if (!resLoads.success) {
        res.status(500).json({ error: 'Не удалось обработать запрос. ' + resLoads.message });
        return;
      }

      const savedUnitLoads = resLoads.savedUnitLoads as UnitLoadItem[];


      // отправляем ответ
      res.status(200).json({
        success: true,
        loads: savedUnitLoads,
      });
      break;

     
    default:
      res.status(405).end(); // Метод не поддерживается
  }
}
// ДЕЙСТВИЯ
async function updateLoads(
  unitLoadRepository: Repository<UnitLoadTable>,
  unitLoads: UnitLoadItem[],
  company_id: number
):Promise<{success:boolean,savedUnitLoads:UnitLoadItem[],message:string }>{

  // // СПИСОК ДЕЙСТВИЙ в базе
  // const existingActions = await actionsRepository.find({ where: { company_id: company_id } });

  // // 1. Найдём удалённые операции
  // const actionToDelete = existingActions.filter(action =>
  //   !actions.some(newActions => newActions.id === action.id) // Сравниваем id существующих стадий с переданными
  // );

  // // 2. Найдём новые стадии, которых нет в базе
  // const actionToAdd = actions.filter(action =>
  //   !existingActions.some(existingAction => existingAction.id === action.id) // Сравниваем id переданных стадий с существующими
  // );

  // // 3. Найдём существующие стадии для обновления
  // const actionToUpdate = actions.filter(action =>
  //   existingActions.some(existingAction => existingAction.id === action.id) // Сравниваем id для существующих стадий
  // );

  // // Удаляем старые стадии
  // if (actionToDelete.length > 0) {
  //   await actionsRepository.remove(actionToDelete);
  // }

  // // Добавляем новые стадии
  // const newAction = actionToAdd.map(action => {
  //   return actionsRepository.create({
  //     title: action.title,
  //     interruptible: action.interruptible,
  //     company_id: company_id,
  //   });
  // });
  // let savedNewActions = [] as ActionTable[]
  // if (newAction.length > 0) savedNewActions = await actionsRepository.save(newAction);
  // if (!savedNewActions) return { success: false, message: "Не удалось сохранить действие" }


  // // Обновляем существующие стадии
  // const updatedActions = actionToUpdate.map(action => {
  //   const existingAction = existingActions.find(existingAction => existingAction.id === action.id);
  //   if (existingAction) {
  //     existingAction.title = action.title; // Обновляем нужные поля
  //     existingAction.interruptible = action.interruptible; // Обновляем нужные поля
  //     return actionsRepository.create(existingAction);
  //   }
  //   return null;
  // }).filter(unitAction => unitAction !== null);

  // let savedUpdatedActions = [] as ActionTable[]
  // if (updatedActions.length > 0) savedUpdatedActions = await actionsRepository.save(updatedActions);
  // if (!savedUpdatedActions) return { success: false, message: "Не удалось сохранить действия " }

  // // Все действия сохранены, проверка
  // let error = ""
  // const savedActions = [...savedNewActions, ...savedUpdatedActions] as ActionTable[]

  // // вход и выход массив операций не совпадает количество записей - чтото не сохранилось
  // if (savedActions.length > 0 && actions.length !== savedActions.length) {
  //   error = `Не удалось сохранить действия`;
  //   console.log(error);
  //   return { success: false, message: error }
  // }

  // // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  // if (savedActions.length > 0 && actions.length > 0) {
  //   if (savedActions.length > 0) {

  //     savedActions.forEach((action, index) => {
  //       if (action.id) {
  //         console.log(`Действие успешно сохранено с id: ${action.id}`);
  //       } else {
  //         error = `Ошибка при сохранении действия ${index + 1}`;
  //         console.log(error);
  //         return { success: false, message: error }
  //       }
  //     });
  //   } else {
  //     error = `Не удалось сохранить действия`;
  //     console.log(error);
  //     return { success: false, message: error }
  //   }
  // }
  return { success: true, savedUnitLoads: [] as UnitLoadItem[],message:""}
}
