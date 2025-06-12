
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnits, getUnitLoads } from './handlers-get';  // расчеты
import { getAllPreparedOperationsIds, planTCardFromOperINC } from './handlers-plan';  // планирование карты
import { getTCard, getTeamShedule, getExceptions, getTCardFull,getUnitActions } from './handlers-get';  // 

import { Repository, In } from 'typeorm';

import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions';
import { TeamScheduleTable } from '@/pages/db/models/plan/team_schedule';
import { TCardTable } from '@/pages/db/models/data/t_cards'

import { UnitTable } from '@/pages/db/models/catalogs/units'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { TCardStageTable } from '@/pages/db/models/data/t_card_stages'


import { UnitLoadItem, StatusEnum } from "@/types";


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
    const teamScheduleRepository = dbConnection.getRepository(TeamScheduleTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);
    const tCardStageRepository = dbConnection.getRepository(TCardStageTable);


    // userId, teamId в любом случае
    const { userId, teamId, tCardId, today } = req.query;

    switch (req.method) {
      // ПРЕДВАРИТЕЛЬНОЕ ПЛАНИРОВАНИЕ/допланирование недостающих операций карты
      case 'GET':

        let tCardLoads = [] as UnitLoadItem[];

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(Number(tCardId), tCardRepository, tCardOperationsRepository, tCardProductRepository, tCardStageRepository)
        if (!tCard) {
          res.status(200).json({
            success: false,
            tCardLoads: [] as UnitLoadItem[],
            message: "Карта не найдена",
          });
          return
        }

        let allPreparedOperationsIds = getAllPreparedOperationsIds(tCard);

        // запросим юниты
        const units_ = await getUnits(Number(teamId), unitRepository)

        // запросим действия юнитов
        const unitActions_ = await getUnitActions(Number(teamId),  unitActionsRepository)

        // запросим расписание компании
        const shedule_ = await getTeamShedule(Number(teamId), teamScheduleRepository)

        //  получим исключения рабочего времени юнитов         
        const exceptionItems = await getExceptions(Number(teamId), unitExceptionsRepository)
        //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
        const unitLoadItemsBD = await getUnitLoads(units_, unitLoadRepository)
        //  уберем из нее лоады нашей карты
        let unitLoadItemsFull = unitLoadItemsBD.filter(lo => tCardId !== lo.id)
        // в этих лоадах нет операций в статусе prepared


        // Планируем карту все операции статуса prepared
        let resultPlaningNextOper = planTCardFromOperINC(allPreparedOperationsIds, tCard, units_,unitActions_, shedule_, unitLoadItemsFull, exceptionItems, String(today))
        //  Если не удалось запланировать
        if (!resultPlaningNextOper.success) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: resultPlaningNextOper.message,
          });
          break;
        }

        // Отправляем ответ с данными  в базе их нет это только драфт
        res.status(200).json({
          success: true,
          tCardLoads: resultPlaningNextOper.planedCardLoads,
          messsage: resultPlaningNextOper.message,
        });
        break;


      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса ((pre-fullcardplan-api)):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}
// // ЗАГРУЗКИ ЮНИТОВ ПО КАРТЕ
// async function updateLoads(
//   unitLoadRepository: Repository<UnitLoadTable>,
//   loads: UnitLoadItem[],
//   team_id: number
// ): Promise<{ success: boolean, savedUnitLoads?: UnitLoadItem[], message?: string }> {

//   // СПИСОК ЗАГРУЗОК в базе по этой компании
//   const existingLoads = await unitLoadRepository.find({ where: { team_id: team_id } });
//   // удаленных загрузок здесь не будет потому что это может быть только при удалении операции
//   // (потом надо дописать при удалении в процессе редактуры тех карты)
//   //  может быть только добавление новой и редактирование существующей загрузки


//   // 2. Найдём новые загрузки которых нет в базестадии, которых нет в базе
//   const loadsToAdd = loads.filter(load =>
//     !existingLoads.some(existingLoad => existingLoad.id === load.id)
//   );

//   // 3. Найдём существующие загрузки для обновления
//   const loadsToUpdate = loads.filter(load =>
//     existingLoads.some(existingLoad => existingLoad.id === load.id)
//   );


//   // Добавляем новые Загрузки и меняем статус
//   const newLoads = loadsToAdd.map(load => {
//     return unitLoadRepository.create({

//       date: load.date, // дата операции
//       idc_oper: load.idc_oper, // Идентификатор операции
//       id_tCard: load.id_tCard, // Идентификатор тех карты
//       timeStart: load.timeStart, // Время начала в минутах
//       timeFinish: load.timeFinish, // Время окончания в минутах
//       team_id: team_id,
//       unit_id: load.unit.id
//     });
//   });
//   let savedNewLoads = [] as UnitLoadTable[]
//   if (newLoads.length > 0) savedNewLoads = await unitLoadRepository.save(newLoads);
//   if (!savedNewLoads) return { success: false, message: "Не удалось сохранить действие" }


//   // Обновляем существующие загрузки
//   const updatedLoads = loadsToUpdate.map(load => {
//     const existingLoad = existingLoads.find(existingLoad => existingLoad.id === load.id);

//     if (existingLoad) {
//       // Обновляем нужные поля
//       const [year, month, day] = load.date.split('-').map(Number);
//       existingLoad.date = new Date(year, month - 1, day);
//       existingLoad.timeFinish = load.timeFinish;
//       existingLoad.timeStart = load.timeStart;
//       if (load.unit) {
//         existingLoad.unit_id = Number(load.unit.id);
//       }
//       return unitLoadRepository.create(existingLoad);
//     }
//     return null;
//   }).filter(load => load !== null);

//   let savedUpdatedLoads = [] as UnitLoadTable[]
//   if (updatedLoads.length > 0) savedUpdatedLoads = await unitLoadRepository.save(updatedLoads);
//   if (!savedUpdatedLoads) return { success: false, message: "Не удалось сохранить загрузки " }

//   // Все действия сохранены, проверка
//   let error = ""
//   const savedLoads = [...savedNewLoads, ...savedUpdatedLoads] as UnitLoadTable[]

//   // вход и выход массив операций не совпадает количество записей - чтото не сохранилось
//   if (savedLoads.length > 0 && loads.length !== savedLoads.length) {
//     error = `Не удалось сохранить действия`;
//     //  console.log(error);
//     return { success: false, message: error }
//   }


//   // Проверка, что массив не пуст и все объекты имеют сгенерированный id
//   if (savedLoads.length > 0 && loads.length > 0) {
//     if (savedLoads.length > 0) {

//       savedLoads.forEach((load, index) => {

//         if (load.id) {
//           console.log(`Загрузка успешно сохранена с id: ${load.id}`);
//         } else {
//           error = `Ошибка при сохранении Загрузки ${index + 1}`;
//           console.log(error);
//           return { success: false, message: error }
//         }
//       });
//     } else {
//       error = `Не удалось сохранить загрузки`;
//       console.log(error);
//       return { success: false, message: error }
//     }
//   }

//   let savedUnitLoads = savedLoads.map(load => {
//     let foundLoad = loads.find(lo => lo.idc_oper === load.idc_oper && lo.id_tCard === load.id_tCard)

//     return {
//       id: load.id,
//       unit: (foundLoad) ? foundLoad.unit : {} as UnitItem,
//       date: (new Date(load.date)).toLocaleDateString('en-CA'), //   перевели в строковый формат
//       idc_oper: load.idc_oper,
//       id_tCard: load.id_tCard,
//       timeStart: load.timeStart,
//       timeFinish: load.timeFinish,
//       status: StatusEnum.planed
//     } as UnitLoadItem
//   })
//   return { success: true, savedUnitLoads: savedUnitLoads, message: "" }
// }
// // ТКАРТА ОБНОВЛЯЮ СТАТУС
// //
// async function updateStatusCard(
//   tCardRepository: Repository<TCardTable>,
//   tCard: TCardItem,
//   status: StatusEnum
// ): Promise<{ success: boolean, message?: string }> {
//   const updateResult = await tCardRepository.update(tCard.id, { status });

//   // Проверяем, что обновление затронуло хотя бы одну запись
//   if (updateResult.affected && updateResult.affected > 0) {
//     console.log('Карта успешно обновлена с id:', tCard.id);
//     return { success: true };
//   } else {
//     const error = `Ошибка при обновлении карты ${JSON.stringify(tCard)}`;
//     console.error(error);
//     return { success: false, message: error };
//   }
// }