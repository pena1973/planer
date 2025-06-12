
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getDependentOperationsIds, getEarliestStart, } from './handlers-plan';  // планирование карты
import { getTCard, getTCardFull } from './handlers-get';  // 


import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { TCardStageTable } from '@/pages/db/models/data/t_card_stages'
import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';

import { TCardProductItem, TCardOperationItem, UnitLoadItem, StatusEnum, } from "@/types";

import { Repository, In } from 'typeorm';

interface RequestBody {
  tCardLoads: UnitLoadItem[],
  erazload: UnitLoadItem,
  today: string,
  teamId:number,
  userId:number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const tCardStagesRepository = dbConnection.getRepository(TCardStageTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);

    const { userId, teamId } = req.query;

    switch (req.method) {
      case 'POST':

        const { tCardLoads, erazload, today,teamId,userId } = req.body as RequestBody;

        let tCardLoadsUpdated = [...tCardLoads];

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(erazload.id_tCard, tCardRepository, tCardOperationsRepository, tCardProductRepository,tCardStagesRepository)
        if (!tCard) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        const oper = tCard.tCardOperations?.find(oper => oper.id === erazload?.id_oper);
        if (!oper) {
          res.status(200).json({ success: false, message: "Операция в базе не найдена" });
          return
        }

        //  получаем список Id операций которые зависимы от нашей  -  
        // их будем удалять или отменять в зависимости от даты и статуса
        let dependentOperationsIds = getDependentOperationsIds(tCard, oper);

        // добавлю и нашу операцию тоже
        dependentOperationsIds.push(Number(oper.id));

        // Разделяю все наши операции по статусам и датам
        // все что ready, performed,defected - ничего не делаю  -  это уже пароизошло

        // меняем в базе статус стертых операций на Prepared
        const resSetOperStatus = await setOperStatus(dependentOperationsIds, StatusEnum.prepared, tCardOperationsRepository);

        if (!resSetOperStatus.success) {
          res.status(200).json({ success: false, message: "Не удалось  поменять статус операций" });
        }

        // меняем в базе статус карты на Prepared если необходимо
        const resSetTCardStatus = await setTCardStatus(tCard.id, StatusEnum.prepared, tCardRepository);

        if (!resSetTCardStatus.success) {
          res.status(200).json({ success: false, message: "Не удалось  поменять статус карты" });
        }

        // prepared - удаляю вообще без условий они даже не записаны
        tCardLoadsUpdated = tCardLoadsUpdated.filter(lo => {
          return !(dependentOperationsIds.includes(lo.id_oper) && lo.status === StatusEnum.prepared)
        })

        const tCardLoadsToCancel = tCardLoadsUpdated.filter(lo => {
          return (dependentOperationsIds.includes(lo.id_oper)
            && lo.date < today && lo.status === StatusEnum.planed)
        })

        const tCardLoadsToDelete = tCardLoadsUpdated.filter(lo => {
         return( dependentOperationsIds.includes(lo.id_oper)
            && lo.date >= today && lo.status === StatusEnum.planed)
        })

        // // planed - вчерашние и раньше перевожу в canceled но не удаляю - это уже история          
        // let dependentOperationsIdstoCancel = dependentOperationsIds.filter(oper_id => {
        //   let op = tCard.tCardOperations?.find(op => op.id === oper_id)
        //   let opLoads = tCardLoads.filter(lo => lo.id_oper === oper_id)
        //   const earliestStart = getEarliestStart(opLoads);
        //   if (!earliestStart) return false // операция не запланирована         
        //   return (earliestStart.date < today && op?.status === StatusEnum.planed)
        // })

        // // planed - сегодня и позже по дате  -  удаляю       
        // let dependentOperationsIdstoDelete = dependentOperationsIds.filter(oper_id => {
        //   let op = tCard.tCardOperations?.find(op => op.id === oper_id)
        //   let opLoads = tCardLoads.filter(lo => lo.id_oper === oper_id)
        //   const earliestStart = getEarliestStart(opLoads);
        //   if (!earliestStart) return false // операция не запланирована         
        //   return (earliestStart.date >= today && op?.status === StatusEnum.planed)
        // })

        //  только в статусе planed и только позже равно today
        const resDelete = await deleteLoads(tCardLoadsToDelete, today, unitLoadRepository);
        // Удаление лоадов прошло успешно
        if (!resDelete.success) {
          res.status(200).json({ success: false, message: "Не удалось удалить планирование операции и зависимых от нее" });
          return
        }

        // удаляем из нашего пакета удаленные лоады
        // tCardLoadsUpdated = tCardLoadsUpdated.filter(lo => !dependentOperationsIdstoDelete.includes(lo.id_oper))
        tCardLoadsUpdated = tCardLoadsUpdated.filter(load =>
          !tCardLoadsToDelete.some(delLoad => delLoad.id === load.id)
        );

        //  только в статусе planed и только раньше today
        const resCancel = await cancelLoads(tCardLoadsToCancel, today, unitLoadRepository);
        // Отмена лоадов прошла успешно
        if (!resCancel.success) {
          res.status(200).json({ success: false, message: "Не удалось отменить историческое планирование операции и зависимых от нее" });
          return
        }

        // меняем статус из нашего пакета отмененные  лоады
        // tCardLoadsUpdated = tCardLoadsUpdated.map(lo => {
        //   return dependentOperationsIdstoCancel.includes(lo.id_oper) ? { ...lo, status: StatusEnum.cancelled } : lo;
        // })        

         tCardLoadsUpdated = tCardLoadsUpdated.map(load =>
          tCardLoadsToCancel.some(cancelLoad => cancelLoad.id === load.id)
            ? { ...load, status: StatusEnum.cancelled }
            : load
        );

      // Получим карту в ее новом состоянии и тоже передадим      
        
      const _tCard = await getTCardFull(erazload.id_tCard, tCardRepository, tCardOperationsRepository, tCardProductRepository,tCardStagesRepository)
        if (!tCard) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        res.status(200).json({ 
          success: true, 
          unitsLoads: tCardLoadsUpdated, 
          tCard: _tCard, 
          message: "" });
        break;

      default:
    }
    res.status(405).end(); // Метод не поддерживается

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (eraze-load-plan-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}


// const cancelLoads = async (  
//   cancellLoads: UnitLoadItem[],
//   today: string, // "YYYY-MM-DD"
//   unitLoadRepository: Repository<UnitLoadTable>
// ): Promise<{ success: boolean, message: string }> => {
//   if (cancellOperIds.length === 0) return { success: true, message: `Нет операций для отмены.` };
//   try {
//     const result = await unitLoadRepository.createQueryBuilder()
//       .update(UnitLoadTable)
//       .set({ status: StatusEnum.cancelled })
//       .where("id_oper IN (:...cancellOperIds)", { cancellOperIds })
//       .andWhere("status = :planed", { planed: StatusEnum.planed })
//       .andWhere("date < :today", { today })
//       .execute();

//     if (result.affected && result.affected > 0) {
//       return { success: true, message: `Обновлено ${result.affected} загрузок.` };
//     } else {
//       return { success: false, message: "Нет загрузок для отмены." };
//     }
//   } catch (error) {
//     console.error("Ошибка при отмене загрузок:", error);
//     return { success: false, message: "Ошибка при отмене загрузок." };
//   }
// };

const cancelLoads = async (
  cancellLoads: UnitLoadItem[],
  today: string, // формат "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean, message: string }> => {
  // Извлекаем id загрузок, которые переданы в массиве
  const loadIds = cancellLoads
    .map(load => load.id)
    .filter((id): id is number => id !== undefined);

  if (loadIds.length === 0) {
    return { success: true, message: "Нет загрузок для отмены." };
  }

  try {
    const result = await unitLoadRepository
      .createQueryBuilder()
      .update(UnitLoadTable)
      .set({ status: StatusEnum.cancelled })
      .where("id IN (:...loadIds)", { loadIds })
      .andWhere("status = :planed", { planed: StatusEnum.planed })
      .andWhere("date < :today", { today })
      .execute();

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлено ${result.affected} загрузок.` };
    } else {
      return { success: false, message: "Нет загрузок для отмены." };
    }
  } catch (error: any) {
    console.error("Ошибка при отмене загрузок:", error);
    return { success: false, message: error.message || "Ошибка при отмене загрузок." };
  }
};

const deleteLoads = async (
  delLoads: UnitLoadItem[],
  today: string, // "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean, message: string }> => {
  // Извлекаем id загрузок, фильтруя возможные undefined
  const loadIds = delLoads.map(load => load.id).filter((id): id is number => id !== undefined);
  if (loadIds.length === 0) {
    return { success: true, message: "Нет загрузок для удаления." };
  }

  try {
    const result = await unitLoadRepository
      .createQueryBuilder()
      .delete()
      .from(UnitLoadTable)
      .where("id IN (:...loadIds)", { loadIds })
      .andWhere("status = :status", { status: StatusEnum.planed })
      .andWhere("date >= :today", { today })
      .execute();

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Удалено ${result.affected} загрузок.` };
    } else {
      return { success: false, message: "Нет загрузок для удаления." };
    }
  } catch (error: any) {
    console.error("Ошибка при удалении загрузок:", error);
    return { success: false, message: error.message || "Ошибка при удалении загрузок." };
  }
};

const setOperStatus = async (
  operationIds: number[],
  newStatus: StatusEnum,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<{ success: boolean, message: string }> => {
  try {
    const result = await tCardOperationsRepository
      .createQueryBuilder()
      .update(TCardOperationTable)
      .set({ status: newStatus })
      .where("id IN (:...operationIds)", { operationIds })
      .execute();

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлено ${result.affected} операций.` };
    } else {
      return { success: false, message: "Ни одна операция не обновлена." };
    }
  } catch (error: any) {
    console.error("Ошибка обновления операций:", error);
    return { success: false, message: error.message || "Ошибка обновления статуса операций." };
  }
};

const setTCardStatus = async (
  tCardId: number,
  newStatus: StatusEnum,
  tCardRepository: Repository<TCardTable>
): Promise<{ success: boolean, message: string }> => {
  try {
    const result = await tCardRepository
      .createQueryBuilder()
      .update(TCardTable)
      .set({ status: newStatus })
      .where("id = :tCardId", { tCardId })
      .execute();

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлена карта с id: ${tCardId}` };
    } else {
      return { success: false, message: "Карта не обновлена." };
    }
  } catch (error: any) {
    console.error("Ошибка обновления карты:", error);
    return { success: false, message: error.message || "Ошибка обновления статуса карты." };
  }
};
