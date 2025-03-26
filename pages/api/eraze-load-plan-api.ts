
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getDependentOperationsIds, getEarliestStart, deleteLoads, cancelLoads } from './handlers-plan';  // планирование карты
import { getTCard, getTCardFull } from './handlers-get';  // 


import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'

import { TCardProductItem, TCardOperationItem, UnitLoadItem, StatusEnum, } from "@/types";


interface RequestBody {
  tCardLoads: UnitLoadItem[],
  deletedLoad: UnitLoadItem,
  today: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);

    const { userId, companyId } = req.query;

    switch (req.method) {
         case 'POST':

           const { tCardLoads, deletedLoad, today } = req.body as RequestBody;

           const tCard_ = await getTCard(Number(deletedLoad.id_tCard), tCardRepository)
           if (!tCard_) {
             res.status(200).json({ success: false, error: "Карта с таким номером не найдена" });
             return
           }

          // получаем полную карту со всеми входящими и исходящими
          const tCard = await getTCardFull(deletedLoad.id_tCard, tCardRepository, tCardOperationsRepository, tCardProductRepository)
          if (!tCard) {
            res.status(200).json({ success: false, error: "Карта с таким номером не найдена" });
            return
          }

          const oper = tCard.tCardOperations?.find(oper => oper.id === deletedLoad?.id_oper);
          if (!oper) {
            res.status(200).json({ success: false, error: "Операция в базе не найдена" });
            return
          }

          //  получаем список операций которые зависимы от нашей  -  
          // их будем удалять или отменять в зависимости от даты и статуса
          let dependentOperationsIds = getDependentOperationsIds(tCard, oper);

          // добавлю и нашу операцию тоже
          dependentOperationsIds.push(Number(oper.id));

          // Разделяю все наши операции по статусам и датам
          // все что ready, performed,defected - ничего не делаю  -  это уже пароизошло

          // planed - вчерашние и раньше перевожу в canceled но не удаляю
          let dependentOperationsIdstoCancel = dependentOperationsIds.filter(oper_id => {
            let op = tCard.tCardOperations?.find(op => op.id === oper_id)
            let opLoads = tCardLoads.filter(lo => lo.id_oper === oper_id)
            const earliestStart = getEarliestStart(opLoads);
            if (!earliestStart) return false // операция не запланирована         
            return (earliestStart.date < today && op?.status === StatusEnum.planed)
          })

          // planed - сегодня и позже по дате  -  удаляю
          // Стираю лоады операции и  все зависимые лоады   
          let dependentOperationsIdstoDelete = dependentOperationsIds.filter(oper_id => {
            let op = tCard.tCardOperations?.find(op => op.id === oper_id)
            let opLoads = tCardLoads.filter(lo => lo.id_oper === oper_id)
            const earliestStart = getEarliestStart(opLoads);
            if (!earliestStart) return false // операция не запланирована         
            return (earliestStart.date >= today && op?.status === StatusEnum.planed)
          })

        // ДОПИСАТЬ!!
        const resDelete = deleteLoads(dependentOperationsIdstoDelete);
        // здесь надо вернуть лоады канскленные
        const resCancel = cancelLoads(dependentOperationsIdstoCancel);

        //  Если не удалось стереть
        if (!resDelete || !resCancel) {
          res.status(200).json({
            success: false,
            unitsLoads: undefined,
          });
        }

        res.status(200).json({ success: true, unitsLoads: tCardLoads });

        break;

         default:
    }
    res.status(405).end(); // Метод не поддерживается

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (erazeplan-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}

