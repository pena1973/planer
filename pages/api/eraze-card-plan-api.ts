
import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnits, getUnitLoads } from './handlers-get';  // расчеты
import { getEarliestStart } from './handlers-plan';  // планирование карты


import { Repository, In } from 'typeorm';

import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions';
import { TeamScheduleTable } from '@/pages/db/models/plan/team_schedule';
import { TCardTable } from '@/pages/db/models/data/t_cards'

import { UnitTable } from '@/pages/db/models/catalogs/units'

import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { getTCard, getTCardFull } from './handlers-get';  // 
import { updateStatusTCard } from './handlers-update';  // 

import { TCardStageTable } from '@/pages/db/models/data/t_card_stages'

import { TCardOperationItem, UnitLoadItem, StatusEnum } from "@/types";

interface RequestBody {
  tCardLoads: UnitLoadItem[],
  tCardId: number,
  today: string,
  teamId: number,
  userId: number
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const TeamScheduleRepository = dbConnection.getRepository(TeamScheduleTable);
    const tCardStagesRepository = dbConnection.getRepository(TCardStageTable);

    switch (req.method) {

      // Стираем планирование всех плановых и отменяем все что в истории кроме выполненных

      case 'POST':
        const { tCardLoads, tCardId, today, teamId, userId } = req.body as RequestBody; //  загрузки по карте и только draft -  массив интервалов

        //tCardLoads //Это все лоады покарте

        // Убираем prepared
        let tCardLoadsUpdated = tCardLoads.filter(lo => {
          return lo.status !== StatusEnum.prepared
        });

        // выделяем лоады planed отдельно
        let tCardLoadsPlaned = tCardLoadsUpdated.filter(lo => lo.status === StatusEnum.planed);
        tCardLoadsUpdated = tCardLoadsUpdated.filter(lo => lo.status !== StatusEnum.planed);


        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(tCardId, tCardRepository, tCardOperationsRepository, tCardProductRepository, tCardStagesRepository)
        if (!tCard) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }
        let tCardStatus = tCard.status;

        // получаем операции planed с актуальными датами планирования, операции planed еше не выполнены и их можно отменить(история) 
        // или вообще удалить (будущее)
        let oper_dateStart = tCard.tCardOperations?.map(op => {
          let opLoads = tCardLoadsPlaned.filter(lo => lo.id_oper === op.id)
          const earliestStart = getEarliestStart(opLoads);
          if (!earliestStart) return undefined //  просто уберем операцию изо обработки  ее итак нет 
          return { oper: op, dateStart: earliestStart.date }
        }).filter(op => (op)) as { oper: TCardOperationItem, dateStart: string }[];

        let operToCancellIds = oper_dateStart.filter(elem => elem.dateStart < today).map(elem => elem.oper.id) as number[] //  в истории канцелим
        let operToDeleteIds = oper_dateStart.filter(elem => elem.dateStart >= today).map(elem => elem.oper.id) as number[] // в планировании удаляем

        // обрабатываем  лоады  в базе      
        if (operToCancellIds.length > 0) {
          const resCancel = await cancelLoads(operToCancellIds, today, unitLoadRepository);
          if (!resCancel.success) {
            res.status(200).json({ success: false, message: "Не удалось отменить историческое планирование операции и зависимых от нее" });
            return
          }
        }

        if (operToDeleteIds.length > 0) {
          const resDelete = await deleteLoads(operToDeleteIds, today, unitLoadRepository);
          if (!resDelete.success) {
            res.status(200).json({ success: false, message: "Не удалось уалить запланированные лоады" });
            return
          }
        }

        const operToMakePreparedIds = [...operToDeleteIds, ...operToCancellIds];

        // обрабатываем  в базе операции при отмене лоадов операция уходит в prepared если они есть
        if (operToMakePreparedIds.length > 0) {
          const resSetOperStatus = await setOperStatus(operToMakePreparedIds, StatusEnum.prepared, tCardOperationsRepository);
          if (!resSetOperStatus.success) {
            res.status(200).json({ success: false, message: "Не удалось  поменять статус операций" });
          }
        }


        // КАРТА
        // меняем в базе статус карты на Prepared  если действительно есть что отменять
        if (operToMakePreparedIds.length > 0) {
          const resSetTCardStatus = await updateStatusTCard( tCardRepository,tCardId, StatusEnum.prepared);

          if (!resSetTCardStatus.success) {
            res.status(200).json({ success: false, message: "Не удалось  поменять статус карты" });
          }
          tCardStatus = StatusEnum.prepared; // обновляем статус карты в ответе
        }

        // собираем все отработанные лоады с измененными статусами
        let tCardLoadsPlaned_ = tCardLoadsPlaned.filter(lo => operToCancellIds.includes(lo.id_oper)).map(lo => { return { ...lo, status: StatusEnum.cancelled } })
        tCardLoadsUpdated = [...tCardLoadsUpdated, ...tCardLoadsPlaned_]
        // отправляем ответ
        res.status(200).json({
          success: true,
          tCardLoads: tCardLoadsUpdated,
          tCardStatus:tCardStatus,
          message: ""
        });
        break;


      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (eraze-card-plan-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}


const cancelLoads = async (
  cancellOperIds: number[],
  today: string, // "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean, message: string }> => {
  if (cancellOperIds.length === 0) return { success: true, message: `Нет операций для отмены.` };
  try {
    const result = await unitLoadRepository.createQueryBuilder()
      .update(UnitLoadTable)
      .set({ status: StatusEnum.cancelled })
      .where("id_oper IN (:...cancellOperIds)", { cancellOperIds })
      .andWhere("status = :planed", { planed: StatusEnum.planed })
      .andWhere("date < :today", { today })
      .execute();

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлено ${result.affected} загрузок.` };
    } else {
      return { success: false, message: "Нет загрузок для отмены." };
    }
  } catch (error) {
    console.error("Ошибка при отмене загрузок:", error);
    return { success: false, message: "Ошибка при отмене загрузок." };
  }
};


const deleteLoads = async (
  delOperIds: number[],
  today: string, // "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean, message: string }> => {

  if (delOperIds.length === 0) return { success: true, message: `Нет операций для удаления.` };

  try {
    const result = await unitLoadRepository
      .createQueryBuilder()
      .delete()
      .from(UnitLoadTable)
      .where("id_oper IN (:...delOperIds)", { delOperIds })
      .andWhere("status = :status", { status: StatusEnum.planed })
      .andWhere("date >= :today", { today })
      .execute();

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Удалено ${result.affected} загрузок.` };
    } else {
      return { success: false, message: "Нет загрузок для удаления." };
    }
  } catch (error) {
    console.error("Ошибка при удалении загрузок:", error);
    return { success: false, message: "Ошибка при удалении загрузок." };
  }
};


const setOperStatus = async (
  operationIds: number[],
  newStatus: StatusEnum,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<{ success: boolean, message: string }> => {
  if (operationIds.length === 0) return { success: true, message: `Нет операций для изменения.` };
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

// const setTCardStatus = async (
//   tCardId: number,
//   newStatus: StatusEnum,
//   tCardRepository: Repository<TCardTable>
// ): Promise<{ success: boolean, message: string }> => {
//   try {
//     const result = await tCardRepository
//       .createQueryBuilder()
//       .update(TCardTable)
//       .set({ status: newStatus })
//       .where("id = :tCardId", { tCardId })
//       .execute();

//     if (result.affected && result.affected > 0) {
//       return { success: true, message: `Обновлена карта с id: ${tCardId}` };
//     } else {
//       return { success: false, message: "Карта не обновлена." };
//     }
//   } catch (error: any) {
//     console.error("Ошибка обновления карты:", error);
//     return { success: false, message: error.message || "Ошибка обновления статуса карты." };
//   }
// };
export default withAuth(handler)