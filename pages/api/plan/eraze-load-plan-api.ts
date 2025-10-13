//pages/api/units-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getDependentOperations } from './../../../handlers/handlers-plan';  
import { getTCardFull, getTeamShedule, getTCardOperationsByCardId } from './../../../handlers/handlers-get';  
import { updateStatusTCard, updateStatusOperationsByOperIds, } from './../../../handlers/handlers-update';  
import { calculateTCardStatusByOperations, cancelHistoryLoads, deleteFutureLoads } from './../../../handlers/handlers-erase';  

import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { TCardTable } from './../../../db/models/data/t_cards'
import { TCardOperationTable } from './../../../db/models/data/t_card_operations'
import { TCardProductTable } from './../../../db/models/data/t_card_products'
import { ProductTable } from './../../../db/models/data/products'
import { TCardStageTable } from './../../../db/models/data/t_card_stages'
import { UnitLoadTable } from './../../../db/models/plan/unit_loads';
import { ActionTable } from './../../../db/models/catalogs/actions'
import { UnitLoadItem, StatusEnum, } from "./../../../types/types";

import { getCurrentDateInString } from "@/lib/common/timezone"

interface RequestBody {
  tCardLoads: UnitLoadItem[],
  erazload: UnitLoadItem,
  today: string,
  teamId: number,
  userId: number
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {

    const db = await connectDb();

    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
    const tCardProductRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
    const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
    const tCardStagesRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
    const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
    const actionRepository = getTypedRepository(db, 'ActionTable', ActionTable);
    const productRepository = getTypedRepository(db, 'ProductTable', ProductTable);
    const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
    
    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

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
          res.status(200).json({
            success: false,
            message: t('mes.tCardNotFound')
          });
          break
        }

        // запросим расписание компании
        const shedule = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)
        if (!shedule) {
          res.status(200).json({
            success: false,
            // message: "Ошибка, не найдено расписание команды",
            message: t('mes.sheduleNotFound'),
          });
          break;
        }

        const todayStr = getCurrentDateInString(shedule.timeZone)

        // находим операцию лоада который мы стираем
        const oper = tCard.tCardOperations?.find(oper => oper.id === erazload?.id_oper);
        if (!oper) {
          res.status(200).json({
            success: false,
            message: t('mes.opersNotFound'),
          });
          break;
        }

        //  получаем список Id операций которые зависимы от нашей  -  
        // им будем менять статус на подготовлен в зависимости от текущего статуса
        const dependentOperations = getDependentOperations(tCard, oper);

        // добавлю и нашу операцию тоже
        dependentOperations.push(oper);

        // все зависимые операции
        const allDependentOperationsIds = dependentOperations
          .map(oper => oper.id as number)

        // выделяю все запланированные операции и меняю на подготовленные, готовые не меняем - их уже не изменить       
        const dependentPlanedOperationsIds = dependentOperations
          .filter(op => op.status === StatusEnum.planed)
          .map(oper => oper.id as number)


        const resOpers = await updateStatusOperationsByOperIds(userId, locale, tCardOperationsRepository, dependentPlanedOperationsIds, StatusEnum.prepared)
        if (!resOpers.success) {
          res.status(200).json({
            success: false,
            message: `${t('mes.opersStatusesNotSaved')}  ${resOpers.message}`
          });
          break;
        }

        // Получаю все операции карты после смены статуса
        const tCardOperations = await getTCardOperationsByCardId(userId, locale, tCard.id, tCardOperationsRepository)

        // рассчитываем статус карты после отмены
        const statusRes = await calculateTCardStatusByOperations(userId, locale, tCard.status, tCardOperations,);
        if (!statusRes.success) {
          res.status(200).json({
            success: false,
            message: t('mes.tCardStatusNotCalculated'),
          });
          break;
        }

        // обновляю статус карты по меньшему статусу операции
        const resSetTCardStatus = await updateStatusTCard(userId, locale, tCardRepository, tCard.id, StatusEnum.prepared);

        if (!resSetTCardStatus.success) {
          res.status(200).json({
            success: false,
            message: resSetTCardStatus.message,
          });
          break;
        }

        // Лоады
        // если стираемый лоад в статусе prepared - удаляю вообще без условий они даже не записаны
        tCardLoadsUpdated = tCardLoadsUpdated.filter(lo => {
          return !(allDependentOperationsIds.includes(lo.id_oper) && lo.status === StatusEnum.prepared)
        })

        // если стираемый лоад в статусе planed и он раньще текущей даты (в исторической части шкалы)
        //  - отменить
        const tCardLoadsToCancel = tCardLoadsUpdated.filter(lo => {
          return (allDependentOperationsIds.includes(lo.id_oper)
            && lo.date < todayStr && lo.status === StatusEnum.planed)
        })

        // если стираемый лоад в статусе planed и он позже или равен текущей даты (в плановой части шкалы)
        //   -  стереть
        const tCardLoadsToDelete = tCardLoadsUpdated.filter(lo => {
          return (allDependentOperationsIds.includes(lo.id_oper)
            && lo.date >= todayStr && lo.status === StatusEnum.planed)
        })

        //  только в статусе planed и только позже равно today - стираем
        const resDelete = await deleteFutureLoads(userId, locale, tCardLoadsToDelete, todayStr, unitLoadRepository);

        if (!resDelete.success) {
          res.status(200).json({
            success: false,
            message: t('mes.dependentLoadsNotDeleted'),
          });
          break
        }

        // удаляем из нашего пакета удаленные лоады        
        tCardLoadsUpdated = tCardLoadsUpdated.filter(load =>
          !tCardLoadsToDelete.some(delLoad => delLoad.id === load.id)
        );

        //  только в статусе planed и только раньше today
        const resCancel = await cancelHistoryLoads(userId, locale, tCardLoadsToCancel, todayStr, unitLoadRepository);

        if (!resCancel.success) {
          res.status(200).json({
            success: false,
            message: t('mes.dependentLoadsNotCanceled'),
          });
          break
        }

        // меняем статус у отмененные  лоады            
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
          res.status(200).json({
            success: false,
            message: t('mes.tCardNotFound')
          });
          break
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
    res.status(405).json({ error: 'Method not supported.' });

  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/plan/eraze-load-plan-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

// const cancelLoads = async (
//   cancellLoads: UnitLoadItem[],
//   today: string, // формат "YYYY-MM-DD"
//   unitLoadRepository: Repository<UnitLoadTable>
// ): Promise<{ success: boolean; message: string }> => {

//   const loadIds = cancellLoads
//     .map(load => load.id)
//     .filter((id): id is number => id !== undefined);

//   if (loadIds.length === 0) {
//     return { success: true, message: 'Нет загрузок для отмены.' };
//   }

//   try {
//     const result = await unitLoadRepository.update(
//       {
//         id: In(loadIds),
//         status: StatusEnum.planed,
//         date: Raw(dateField => `${dateField} < :today`, { today })
//       },
//       { status: StatusEnum.cancelled }
//     );

//     if (result.affected && result.affected > 0) {
//       return {
//         success: true,
//         message: `Обновлено ${result.affected} загрузок.`,
//       };
//     } else {
//       return {
//         success: false,
//         message: 'Нет загрузок для отмены.',
//       };
//     }

//   } catch (error: unknown) {
//     let message = 'Ошибка при отмене загрузок.';
//     if (error instanceof Error) {
//       message = error.message;
//       console.error('Ошибка при отмене загрузок:', error);
//     } else {
//       console.error('Неизвестная ошибка при отмене загрузок:', error);
//     }
//     return { success: false, message };
//   }
// };

// const deleteLoads = async (
//   delLoads: UnitLoadItem[],
//   today: string, // формат "YYYY-MM-DD"
//   unitLoadRepository: Repository<UnitLoadTable>
// ): Promise<{ success: boolean; message: string }> => {

//   const loadIds = delLoads.map(load => load.id).filter((id): id is number => id !== undefined);

//   if (loadIds.length === 0) {
//     return { success: true, message: 'Нет загрузок для удаления.' };
//   }

//   try {
//     const result = await unitLoadRepository.delete({
//       id: In(loadIds),
//       status: StatusEnum.planed,
//       date: Raw(dateField => `${dateField} >= :today`, { today })
//     });

//     if (result.affected && result.affected > 0) {
//       return { success: true, message: `Удалено ${result.affected} загрузок.` };
//     } else {
//       return { success: false, message: 'Нет загрузок для удаления.' };
//     }

//   } catch (error: unknown) {
//     let message = 'Ошибка при удалении загрузок.';
//     if (error instanceof Error) {
//       message = error.message;
//       console.error('Ошибка при удалении загрузок:', error);
//     } else {
//       console.error('Неизвестная ошибка при удалении загрузок:', error);
//     }
//     return { success: false, message };
//   }
// };



// const setOperStatus = async (
//   operationIds: number[],
//   newStatus: StatusEnum,
//   tCardOperationsRepository: Repository<TCardOperationTable>
// ): Promise<{ success: boolean; message: string }> => {
//   try {
//     const result = await tCardOperationsRepository.update(
//       { id: In(operationIds) },
//       { status: newStatus }
//     );

//     if (result.affected && result.affected > 0) {
//       return {
//         success: true,
//         message: `Обновлено ${result.affected} операций.`,
//       };
//     } else {
//       return {
//         success: false,
//         message: 'Ни одна операция не обновлена.',
//       };
//     }

//   } catch (error: unknown) {
//     let message = 'Ошибка обновления статуса операций.';
//     if (error instanceof Error) {
//       message = error.message;
//       console.error('Ошибка обновления операций:', error);
//     } else {
//       console.error('Неизвестная ошибка обновления операций:', error);
//     }
//     return { success: false, message };
//   }
// };


// const setTCardStatus = async (
//   tCardId: number,
//   newStatus: StatusEnum,
//   tCardRepository: Repository<TCardTable>
// ): Promise<{ success: boolean; message: string }> => {
//   try {
//     const result = await tCardRepository.update(
//       { id: tCardId },
//       { status: newStatus }
//     );

//     if (result.affected && result.affected > 0) {
//       return {
//         success: true,
//         message: `Обновлена карта с id: ${tCardId}`,
//       };
//     } else {
//       return {
//         success: false,
//         message: 'Карта не обновлена.',
//       };
//     }

//   } catch (error: unknown) {
//     let message = 'Ошибка обновления статуса карты.';
//     if (error instanceof Error) {
//       message = error.message;
//       console.error('Ошибка обновления карты:', error);
//     } else {
//       console.error('Неизвестная ошибка обновления карты:', error);
//     }
//     return { success: false, message };
//   }
// };


export default withAuth(handler)