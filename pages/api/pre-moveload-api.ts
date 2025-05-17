// Обработка перемещения операции лоада
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getTCardFull, getUnits, getTeamShedule, getUnitLoads, getExceptions, getUnitActions } from './handlers-get';  // 
import {
  planTCardFromOperINC, planOperOnUnit,
  getDependentOperationsIds, getOperationReadyMoment
} from './handlers-plan';  // 

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
import { StatusEnum } from '@/types'

import {
  UnitItem, UnitLoadItem,
  UnitBelongEnum,
} from "@/types";

interface RequestBody {
  pinnedLoad: UnitLoadItem,
  tCardLoads: UnitLoadItem[], // лоады по карте
  unit: UnitItem,  // Юнит куда перемещаем
  date: string,    // Дата куда перемещаем
  timeStart: number //  время куда перемещаем  
  timeFinish: number //  время окончания в случае если это внешний юнит
  today: string // дата раздела 
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
    const teamScheduleRepository = dbConnection.getRepository(TeamScheduleTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);
    const tCardStageRepository = dbConnection.getRepository(TCardStageTable);
    // userId, teamId в любом случае

    const { userId, teamId } = req.query;

    switch (req.method) {

      // ПЕРЕПЛАНИРОВАНИЕ по перемещению лоада
      case 'POST':
        const { pinnedLoad, tCardLoads, unit, date, timeStart, timeFinish, today } = req.body as RequestBody;
        // tCardLoads-Это все загрузки по карте которую тащим 
        if (tCardLoads.length === 0) {
          // должно быть хотябы один лоад при перемешении
          // Если нет загрузок, можно вернуть пустой результат или обработать ошибку
          res.status(200).json({
            success: false,
            cardLoads: tCardLoads,
            message: "Ошибка, не передано загрузок по карте",
          });
          return;
        }

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(pinnedLoad.id_tCard, tCardRepository, tCardOperationsRepository, tCardProductRepository, tCardStageRepository)
        if (!tCard) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: "Карта не найдена",
          });
          return
        }

        // находим нашу операцию в карте 
        const oper = tCard.tCardOperations?.find(op => op.id === pinnedLoad.id_oper)
        if (!oper) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: `Операция ${pinnedLoad.idc_oper} по карте С-${tCard.idc} не найдена `,
          });
          return

        }

        //  получаем список операций которые зависимы от нашей  -  их будем перепланировать
        let dependentOperationsIds = getDependentOperationsIds(tCard, oper);
        // Формируем массив по карте без лоадов этой операции и зависимых от нее
        let cardLoadsWithoutOperEndDep = tCardLoads.filter(load =>
          !(load.id_oper === oper.id || dependentOperationsIds.includes(load.id_oper as number))
        );

        // также для сохранения истории мы по этой операции и зависимым операциям должны оставить все отмененные бракованные и готовые
        let cardLoadsOperEndDepHistory = tCardLoads.filter(load =>
          !(load.status === StatusEnum.prepared || load.status === StatusEnum.planed)
          && (load.id_oper === oper.id || dependentOperationsIds.includes(load.id_oper as number))
        );

        // сортируем по возрастанию
        cardLoadsWithoutOperEndDep.sort((a, b) =>
          a.date.localeCompare(b.date) || a.timeStart - b.timeStart
        );

        let planedCardLoads = [...cardLoadsWithoutOperEndDep, ...cardLoadsOperEndDepHistory];

        // получаем момент готовности входящих запчастей и не раньше сегодня  и не раньше входящего старта
        let readySourceMoment: { date: string; time: number } | undefined = getOperationReadyMoment(oper, tCard, cardLoadsWithoutOperEndDep, date, timeStart, today)

        if (!readySourceMoment) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: " На момент выполнения операции не готовы входящие источники С-" + tCard.idc,
          });
          return
        }

        // если цель перетаскивания это внешний юнит смотрим начальный или конечный лоад операции
        // операция на внешнем юните имеет только два лоада стартовый и финишный и не имеет ретула
        // продолжительность не зависит от duration а это чисто договоренность с исполнителем
        if (unit.belong === UnitBelongEnum.outer) {

          // 1. если перетаскиваем на внешний
          //   то старт и финиш операции не меняем  и считываем как был из старых лоадов
          let operloads = tCardLoads.filter(load => load.id_oper === pinnedLoad.id_oper);
          // сортируем по возрастанию
          operloads.sort((a, b) =>
            a.date.localeCompare(b.date) || a.timeStart - b.timeStart
          );
          let loadStart = operloads[0];
          let loadFinish = operloads[operloads.length - 1];

          //  с внутреннего
          if (pinnedLoad.unit.belong === UnitBelongEnum.inner) {

            // Формируем стартовый лоад и добавляем в лоады карты
            planedCardLoads.push(
              {
                ...loadStart,
                unit: unit,
                isRetool: false,
                date: readySourceMoment.date,
                timeStart: readySourceMoment.time,
                timeFinish: readySourceMoment.time + 5,
                isPinned: true,
                isOuterStart: true,
                loadInfo: (loadStart.loadInfo) ? { ...loadStart.loadInfo, koef: 1 } : undefined
              })

            // Формируем финишный лоад 
            planedCardLoads.push(
              {
                ...loadFinish,
                unit: unit,
                isRetool: false,
                date: loadFinish.date,
                timeStart: loadFinish.timeFinish - 5,
                timeFinish: loadFinish.timeFinish,
                isPinned: true,
                isOuterFinish: true,
                loadInfo: (loadFinish.loadInfo) ? { ...loadFinish.loadInfo, koef: 1 } : undefined
              })
            //
            // перепланируем зависимые лоады
            // запросим юниты
            const units_ = await getUnits(Number(teamId), unitRepository)

            // запросим действия юнитов
            const unitActions_ = await getUnitActions(Number(teamId), unitActionsRepository)

            // запросим расписание компании
            const shedule_ = await getTeamShedule(Number(teamId), teamScheduleRepository)

            //  получим исключения рабочего времени юнитов         
            const exceptionItems = await getExceptions(Number(teamId), unitExceptionsRepository)

            //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
            const unitLoadItemsBD = await getUnitLoads(units_, unitLoadRepository)
            //  уберем из нее лоады нашей карты
            let unitLoadItemsFull = unitLoadItemsBD.filter(lo => pinnedLoad.id_tCard !== lo.id)
            //  и добавим часть лоадов ко торые не меняются + наш перетащенный
            unitLoadItemsFull = [...unitLoadItemsFull, ...planedCardLoads];


            // Планируем зависимые операции
            let resultPlaningNextOper = planTCardFromOperINC(dependentOperationsIds, tCard, units_, unitActions_, shedule_, unitLoadItemsFull, exceptionItems, today)
            //  Если не удалось запланировать
            if (!resultPlaningNextOper.success) {
              res.status(200).json({
                success: false,
                tCardLoads: tCardLoads,
                message: resultPlaningNextOper.message,
              });
              break;
            }
            planedCardLoads = [...planedCardLoads, ...resultPlaningNextOper.planedCardLoads]

          }

          // 2. перетаскиваем с внешнего на внешний и если корректируемый лоад уже стартовый 
          if ((pinnedLoad.isOuterStart && pinnedLoad.unit.belong === UnitBelongEnum.outer)) {

            // проверяем чтобы начало не было позже хваста операции
            let finishLoad = tCardLoads.find(lo => lo.id_oper === pinnedLoad.id_oper && lo.isOuterFinish);
            if (!finishLoad) {
              res.status(200).json({
                success: false,
                tCardLoads: tCardLoads,
                message: "Не найден лоад окончания операции С-" + tCard.idc,
              });
              return
            }

            if (finishLoad.date < date || finishLoad.date === date && finishLoad.timeFinish < timeStart) {
              res.status(200).json({
                success: false,
                tCardLoads: tCardLoads,
                message: "Нельзя начало операции сделать позже окончания операции С-" + tCard.idc,
              });
              return
            }

            // // ищем дату время с которой операция может стартовать операция исходя из готовности запчастей  
            // let previousOpersIdcs = getPreviousOpers(oper, tCard);
            // if (!previousOpersIdcs) {
            //   res.status(200).json({
            //     success: false,
            //     unitsLoads: loads,
            //     message: "Источник и результат карты не согласован С-" + tCard.number,
            //   });
            //   return
            // }
            // const timeRes = getFinishOperations(previousOpersIdcs, loads, date);
            // if (!timeRes) {
            //   res.status(200).json({
            //     success: false,
            //     unitsLoads: loads,
            //     message: "Источник и результат карты не согласован С-" + tCard.number,
            //   });
            //   return
            // }
            // //  момент возможного выполнения операции (закончены все предыдущие)         
            // const correctRes = getLaterDateTime(timeRes, { date: date, time: timeStart });

            // Формируем стартовый лоад 
            planedCardLoads.push(
              {
                ...loadStart,
                unit: unit,
                isRetool: false,
                date: readySourceMoment.date,
                timeStart: readySourceMoment.time,
                timeFinish: readySourceMoment.time + 5,
                isPinned: true,
                isOuterStart: true,
                loadInfo: (loadStart.loadInfo) ? { ...loadStart.loadInfo, koef: 1 } : undefined
              })
            //  финишный оставляю как есть            
            planedCardLoads.push(loadFinish);
          }


          // 3. перетаскиваем с внешнего на внешний и если корректируемый лоад уже финишный
          if ((pinnedLoad.isOuterFinish && pinnedLoad.unit.belong === UnitBelongEnum.outer)) {

            // проверяем чтобы начало не было позже хваста операции
            let startLoad = tCardLoads.find(lo => lo.id_oper === pinnedLoad.id_oper && lo.isOuterStart);
            if (!startLoad) {
              res.status(200).json({
                success: false,
                tCardLoads: tCardLoads,
                message: "Не найден лоад начала операции С-" + tCard.idc,
              });
              return
            }

            if (startLoad.date > date || startLoad.date === date && startLoad.timeStart > timeStart) {
              res.status(200).json({
                success: false,
                tCardLoads: tCardLoads,
                message: "Нельзя начало операции сделать позже окончания операции С-" + tCard.idc,
              });
              return
            }

            //  стартовый оставляю как есть            
            planedCardLoads.push(loadStart);
            //  финишный меняю дату время 
            planedCardLoads.push(
              {
                ...loadFinish,
                date: date,
                unit: unit,
                isRetool: false,
                timeStart: timeFinish - 5,
                timeFinish: timeFinish,
                isPinned: true,
                isOuterFinish: true,
                loadInfo: (loadFinish.loadInfo) ? { ...loadFinish.loadInfo, koef: 1 } : undefined
              })

            // Далее перепланируем начиная с последующих операций

            // запросим юниты
            const units_ = await getUnits(Number(teamId), unitRepository)

            // запросим действия юнитов
            const unitActions_ = await getUnitActions(Number(teamId), unitActionsRepository)

            // запросим расписание компании
            const shedule_ = await getTeamShedule(Number(teamId), teamScheduleRepository)
            //  получим исключения рабочего времени юнитов         
            const exceptionItems = await getExceptions(Number(teamId), unitExceptionsRepository)
            //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
            const unitLoadItemsBD = await getUnitLoads(units_, unitLoadRepository)
            //  уберем из нее лоады нашей карты
            let unitLoadItemsFull = unitLoadItemsBD.filter(lo => pinnedLoad.id_tCard !== lo.id)
            //  и добавим часть лоадов ко торые не меняются + наш перетащенный
            unitLoadItemsFull = [...unitLoadItemsFull, ...planedCardLoads];


            // Планируем карту начиная с нашей операции исключая ее саму
            let resultPlaningNextOper = planTCardFromOperINC(dependentOperationsIds, tCard, units_, unitActions_, shedule_, unitLoadItemsFull, exceptionItems, today)
            //  Если не удалось запланировать
            if (!resultPlaningNextOper.success) {
              res.status(200).json({
                success: false,
                tCardLoads: tCardLoads,
                message: resultPlaningNextOper.message,
              });
              break;
            }
            planedCardLoads = [...planedCardLoads, ...resultPlaningNextOper.planedCardLoads]
          }
        }
        // внутренний
        else {
          // запросим действия юнитов
          const unitActions_ = await getUnitActions(Number(teamId), unitActionsRepository)
          
          // проверяем выполняет ли выбранный юнит эту операцию
          const actions = unitActions_.filter(ac => ac.unitId === unit.id)
          const foundAction = actions.find(ac => ac.action.id === oper.action.id)
          if (!foundAction) {
            res.status(200).json({
              success: false,
              tCardLoads: tCardLoads,
              message: `Выбранный юнит ${unit.title} не сможет выполнить эту операцию ${oper.action.title}`,
            });
            return
          }

          // запросим юниты
          const units_ = await getUnits(Number(teamId), unitRepository)

          // запросим расписание компании
          const shedule_ = await getTeamShedule(Number(teamId), teamScheduleRepository)

          //  получим исключения рабочего времени юнитов         
          const exceptionItems = await getExceptions(Number(teamId), unitExceptionsRepository)
          //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
          const unitLoadItemsBD = await getUnitLoads(units_, unitLoadRepository)
          //  уберем из нее лоады нашей карты
          let unitLoadItemsFull = unitLoadItemsBD.filter(lo => tCard.id !== lo.id)
          //  и добавим  лоады которые не надо перепланировать из этой карты
          unitLoadItemsFull = [...unitLoadItemsFull, ...planedCardLoads];

          // Планируем нашу операцию на юните
          let resultPlaningOper = planOperOnUnit(oper, tCard, unit,unitActions_, shedule_, unitLoadItemsFull, exceptionItems, today, readySourceMoment.date, readySourceMoment.time)
          //  Если не удалось запланировать
          if (!resultPlaningOper.success) {
            res.status(200).json({
              success: false,
              tCardLoads: tCardLoads,
              message: resultPlaningOper.message,
            });
            break;
          }

          // если операция спланировалась добавим ее лоады и  планируем все последующие операции
          unitLoadItemsFull = [...unitLoadItemsFull, ...resultPlaningOper.operLoads];
          planedCardLoads = [...planedCardLoads, ...resultPlaningOper.operLoads];
          // планируем все последующие операции  исключая пришпиленные

          // Планируем карту начиная с нашей операции (есключая ее саму)
          let resultPlaningNextOper = planTCardFromOperINC(dependentOperationsIds, tCard, units_,unitActions_, shedule_, unitLoadItemsFull, exceptionItems, today)
          //  Если не удалось запланировать
          if (!resultPlaningNextOper.success) {
            res.status(200).json({
              success: false,
              tCardLoads: tCardLoads,
              message: resultPlaningNextOper.message,
            });
            break;
          }
          planedCardLoads = [...planedCardLoads, ...resultPlaningNextOper.planedCardLoads]

        }

        // отправляем ответ
        res.status(200).json({
          success: true,
          tCardLoads: planedCardLoads,
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



// function getLastLoadFinish(operloads: UnitLoadItem[]): { date: string; time: number } | undefined {
//   if (operloads.length === 0) return undefined;
//   // Инициализируем первый элемент как "наиболее поздний"
//   let lastLoad = operloads[0];
//   for (const load of operloads) {
//     // Сравниваем даты, так как формат "YYYY-MM-DD" корректно сравнивается лексикографически
//     if (load.date > lastLoad.date) {
//       lastLoad = load;
//     } else if (load.date === lastLoad.date && load.timeFinish > lastLoad.timeFinish) {
//       lastLoad = load;
//     }
//   }
//   return { date: lastLoad.date, time: lastLoad.timeFinish };
// }
