
import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/translate/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getDependentOperationsIds } from './../../../handlers/handlers-plan';  // планирование карты
import { getTCardFull, getTeamShedule } from './../../../handlers/handlers-get';  // 

import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { TeamTable } from './../../../db/models/catalogs/teams'
import { TCardTable } from './../../../db/models/data/t_cards'
import { TCardOperationTable } from './../../../db/models/data/t_card_operations'
import { TCardProductTable } from './../../../db/models/data/t_card_products'
import { ProductTable } from './../../../db/models/data/products'
import { TCardStageTable } from './../../../db/models/data/t_card_stages'
import { UnitLoadTable } from './../../../db/models/plan/unit_loads';
import { ActionTable } from './../../../db/models/catalogs/actions'
import { UnitLoadItem, StatusEnum, } from "./../../../types/types";

import { getCurrentDateInString } from "@/lib/common/timezone"

import { In, Raw, Repository } from 'typeorm';

interface RequestBody {
  tCardLoads: UnitLoadItem[],
  erazload: UnitLoadItem,
  today: string,
  teamId: number,
  userId: number
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  
  const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
  const tCardProductRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
  const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
  const tCardStagesRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
  const actionRepository = getTypedRepository(db, 'ActionTable', ActionTable);
  const productRepository = getTypedRepository(db, 'ProductTable', ProductTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'POST':

        const { tCardLoads, erazload, teamId, userId } = req.body as RequestBody;

        let tCardLoadsUpdated = [...tCardLoads];

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(
          Number(userId), 
          locale, 
          Number(teamId),
          erazload.id_tCard,
          tCardRepository,
          tCardOperationsRepository,
          tCardProductRepository,
          tCardStagesRepository,
          productRepository,
          actionRepository)
        if (!tCard) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }
        // запросим расписание компании
        const shedule_ = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository, teamsRepository)

        const todayStr = getCurrentDateInString(shedule_.timeZone)


        const oper = tCard.tCardOperations?.find(oper => oper.id === erazload?.id_oper);
        if (!oper) {
          res.status(200).json({ success: false, message: "Операция в базе не найдена" });
          return
        }

        //  получаем список Id операций которые зависимы от нашей  -  
        // их будем удалять или отменять в зависимости от даты и статуса
        const dependentOperationsIds = getDependentOperationsIds(Number(userId), locale, tCard, oper);

        // добавлю и нашу операцию тоже
        dependentOperationsIds.push(Number(oper.id));

        // Разделяю все наши операции по статусам и датам
        // все что ready, performed,defected - ничего не делаю  -  это уже пароизошло

        // меняем в базе статус стертых операций на prepared
        const resSetOperStatus = await setOperStatus(dependentOperationsIds, StatusEnum.prepared, tCardOperationsRepository);

        if (!resSetOperStatus.success) {
          res.status(200).json({ success: false, message: "Не удалось  поменять статус операций" });
        }

        // меняем в базе статус карты на Prepared если необходимо
        const resSetTCardStatus = await setTCardStatus(tCard.id, StatusEnum.prepared, tCardRepository);

        if (!resSetTCardStatus.success) {
          res.status(200).json({ success: false, message: "Не удалось  поменять статус карты" });
        }

        // если стираемый лоад в статусе prepared - удаляю вообще без условий они даже не записаны
        tCardLoadsUpdated = tCardLoadsUpdated.filter(lo => {
          return !(dependentOperationsIds.includes(lo.id_oper) && lo.status === StatusEnum.prepared)
        })

        // если стираемый лоад в статусе planed и он раньще текущей даты (в исторической части шкалы)
        //  - можем просто отменить
        const tCardLoadsToCancel = tCardLoadsUpdated.filter(lo => {
          return (dependentOperationsIds.includes(lo.id_oper)
            && lo.date < todayStr && lo.status === StatusEnum.planed)
        })

        // если стираемый лоад в статусе planed и он позже или равен текущей даты (в плановой части шкалы)
        //   - можем просто стереть (удалить) из базы
        const tCardLoadsToDelete = tCardLoadsUpdated.filter(lo => {
          return (dependentOperationsIds.includes(lo.id_oper)
            && lo.date >= todayStr && lo.status === StatusEnum.planed)
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
        const resDelete = await deleteLoads(tCardLoadsToDelete, todayStr, unitLoadRepository);
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
        const resCancel = await cancelLoads(tCardLoadsToCancel, todayStr, unitLoadRepository);
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

        const _tCard = await getTCardFull(
          Number(userId), 
          locale, 
          Number(teamId),
          erazload.id_tCard,
          tCardRepository,
          tCardOperationsRepository,
          tCardProductRepository,
          tCardStagesRepository,
          productRepository,
          actionRepository
        )
        if (!tCard) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        res.status(200).json({
          success: true,
          unitsLoads: tCardLoadsUpdated,
          tCard: _tCard,
          message: ""
        });
        break;

      default:
    }
    res.status(405).end(); // Метод не поддерживается

  } catch (error: unknown) {
    let errorMessage = "Неизвестная ошибка";

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Ошибка подключения или выполнения запроса (eraze-load-plan-api):", error);
    } else {
      console.error("Неизвестная ошибка подключения (eraze-load-plan-api):", error);
    }

    res.status(500).json({ error: "Не удалось обработать запрос: " + errorMessage });
  }

}

const cancelLoads = async (
  cancellLoads: UnitLoadItem[],
  today: string, // формат "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean; message: string }> => {

  const loadIds = cancellLoads
    .map(load => load.id)
    .filter((id): id is number => id !== undefined);

  if (loadIds.length === 0) {
    return { success: true, message: 'Нет загрузок для отмены.' };
  }

  try {
    const result = await unitLoadRepository.update(
      {
        id: In(loadIds),
        status: StatusEnum.planed,
        date: Raw(dateField => `${dateField} < :today`, { today })
      },
      { status: StatusEnum.cancelled }
    );

    if (result.affected && result.affected > 0) {
      return {
        success: true,
        message: `Обновлено ${result.affected} загрузок.`,
      };
    } else {
      return {
        success: false,
        message: 'Нет загрузок для отмены.',
      };
    }

  } catch (error: unknown) {
    let message = 'Ошибка при отмене загрузок.';
    if (error instanceof Error) {
      message = error.message;
      console.error('Ошибка при отмене загрузок:', error);
    } else {
      console.error('Неизвестная ошибка при отмене загрузок:', error);
    }
    return { success: false, message };
  }
};

const deleteLoads = async (
  delLoads: UnitLoadItem[],
  today: string, // формат "YYYY-MM-DD"
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ success: boolean; message: string }> => {

  const loadIds = delLoads.map(load => load.id).filter((id): id is number => id !== undefined);

  if (loadIds.length === 0) {
    return { success: true, message: 'Нет загрузок для удаления.' };
  }

  try {
    const result = await unitLoadRepository.delete({
      id: In(loadIds),
      status: StatusEnum.planed,
      date: Raw(dateField => `${dateField} >= :today`, { today })
    });

    if (result.affected && result.affected > 0) {
      return { success: true, message: `Удалено ${result.affected} загрузок.` };
    } else {
      return { success: false, message: 'Нет загрузок для удаления.' };
    }

  } catch (error: unknown) {
    let message = 'Ошибка при удалении загрузок.';
    if (error instanceof Error) {
      message = error.message;
      console.error('Ошибка при удалении загрузок:', error);
    } else {
      console.error('Неизвестная ошибка при удалении загрузок:', error);
    }
    return { success: false, message };
  }
};



const setOperStatus = async (
  operationIds: number[],
  newStatus: StatusEnum,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await tCardOperationsRepository.update(
      { id: In(operationIds) },
      { status: newStatus }
    );

    if (result.affected && result.affected > 0) {
      return {
        success: true,
        message: `Обновлено ${result.affected} операций.`,
      };
    } else {
      return {
        success: false,
        message: 'Ни одна операция не обновлена.',
      };
    }

  } catch (error: unknown) {
    let message = 'Ошибка обновления статуса операций.';
    if (error instanceof Error) {
      message = error.message;
      console.error('Ошибка обновления операций:', error);
    } else {
      console.error('Неизвестная ошибка обновления операций:', error);
    }
    return { success: false, message };
  }
};


const setTCardStatus = async (
  tCardId: number,
  newStatus: StatusEnum,
  tCardRepository: Repository<TCardTable>
): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await tCardRepository.update(
      { id: tCardId },
      { status: newStatus }
    );

    if (result.affected && result.affected > 0) {
      return {
        success: true,
        message: `Обновлена карта с id: ${tCardId}`,
      };
    } else {
      return {
        success: false,
        message: 'Карта не обновлена.',
      };
    }

  } catch (error: unknown) {
    let message = 'Ошибка обновления статуса карты.';
    if (error instanceof Error) {
      message = error.message;
      console.error('Ошибка обновления карты:', error);
    } else {
      console.error('Неизвестная ошибка обновления карты:', error);
    }
    return { success: false, message };
  }
};


export default withAuth(handler)