
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnits, getUnitLoads } from './handlers-get';  // расчеты
import { delNextloads } from './handlers-plan';  // планирование карты
import { getTCard, getTCardMatOper, getCompanyShedule } from './handlers-get';  // 


import { Repository, In } from 'typeorm';

import { UnitLoadTable } from '@/pages/db/models/plan/unit-loads';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit-exceptions';
import { CompanyScheduleTable } from '@/pages/db/models/plan/company-schedule';
import { TCardTable } from '@/pages/db/models/data/t_cards'

import { UnitTable } from '@/pages/db/models/catalogs/units'
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'


import {
  UnitItem,
  UnitActionItem, TCardProductItem, TCardOperationItem,
  TCardItem, UnitLoadItem,
  UnitBelongEnum, UnitTypeEnum,
  CalendarItem, TimeTypeEnum, StatusEnum
} from "@/types";

interface RequestBody {
  pinnedLoad:UnitLoadItem, 
  loads:UnitLoadItem[], // лоады по карте
  unit:UnitItem,  // Юнит куда перемещаем
  date:string,    // Дата куда перемещаем
  timeStart:number //  время куда перемещаем  
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const companyScheduleRepository = dbConnection.getRepository(CompanyScheduleTable);
    
    // userId, companyId в любом случае

    const { userId, companyId } = req.query;
    
    switch (req.method) {

      // ЗАПИСЬ  запланированной КАРТЫ в которой стираем планирование
      case 'POST':
        const { pinnedLoad, loads, unit,date,timeStart } = req.body as RequestBody; //  загрузки по карте и только draft -  массив интервалов

         if (loads.length === 0) {
           // Если нет загрузок, можно вернуть пустой результат или обработать ошибку
           return [];
         }

        // // // СПИСОК Загрузок 
        // const resLoads = await deleteLoads(
        //   unitLoadRepository,
        //   unitLoads,
        // )
        // if (!resLoads.success) {
        //   res.status(500).json({ error: 'Не удалось обработать запрос. ' + resLoads.message });
        //   return;
        // }

        // // Статус Карты  меняем на prepared
        // const resCard = await updateStatusCard(tCardRepository, tCard_id, StatusEnum.prepared)
        // if (!resCard.success) {
        //   res.status(500).json({ error: 'Не удалось обработать запрос. ' + resCard.message });
        //   return;
        // }

        // отправляем ответ
        res.status(200).json({
          success: true,
          message: ""
        });
        break;


      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (erazeplan-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}
// ЗАГРУЗКИ ЮНИТОВ ПО КАРТЕ
async function deleteLoads(
  unitLoadRepository: Repository<UnitLoadTable>,
  unitLoads: UnitLoadItem[],
): Promise<{ success: boolean, message?: string }> {

  const loadIds = unitLoads.map(load => load.id); // Получаем массив идентификаторов

  if (loadIds.length === 0) return { success: true, message: "" }

  const unitLoads_ = await unitLoadRepository.createQueryBuilder('unitLoad')
    .andWhere('unitLoad.id IN (:...loadIds)', { loadIds }) // Фильтруем по unitIds
    .getMany();

  if (unitLoads_.length > 0) {
    await unitLoadRepository.remove(unitLoads_);
    console.log(`Удалено ${unitLoads_.length} операций`);
  }

  return { success: true, message: "" }
}
// ТКАРТА ОБНОВЛЯЮ СТАТУС
// 
async function updateStatusCard(
  tCardRepository: Repository<TCardTable>,
  tCard_id: number,
  status: StatusEnum
): Promise<{ success: boolean, message?: string }> {
  const updateResult = await tCardRepository.update(tCard_id, { status });

  // Проверяем, что обновление затронуло хотя бы одну запись
  if (updateResult.affected && updateResult.affected > 0) {
    console.log('Карта успешно обновлена с id:', tCard_id);
    return { success: true };
  } else {
    const error = `Ошибка при обновлении карты (id) ${tCard_id}`;
    console.error(error);
    return { success: false, message: error };
  }
}