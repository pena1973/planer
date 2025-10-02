import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/translate/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getTCardFull, getUnits, getTeamShedule, getUnitLoads, getUnitExceptions, getUnitActions } from './../../../handlers/handlers-get';  // 
import { planTCardFromOperINC, planOperOnUnit, getDependentOperationsIds, getOperationReadyMoment } from './../../../handlers/handlers-plan';  // 

import { TeamTable } from './../../../db/models/catalogs/teams'
import { UnitLoadTable } from './../../../db/models/plan/unit_loads';
import { UnitExceptionTable } from './../../../db/models/plan/unit_exceptions';
import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { TCardTable } from './../../../db/models/data/t_cards'
import { UnitTable } from './../../../db/models/catalogs/units'
import { UnitActionTable } from './../../../db/models/catalogs/unit_actions'
import { TCardOperationTable } from './../../../db/models/data/t_card_operations'
import { TCardProductTable } from './../../../db/models/data/t_card_products'
import { ProductTable } from './../../../db/models/data/products'
import { TCardStageTable } from './../../../db/models/data/t_card_stages'
import { ActionTable } from './../../../db/models/catalogs/actions'
import { StatusEnum } from './../../../types/types'

import { UnitItem, UnitLoadItem, UnitBelongEnum } from "./../../../types/types";

interface RequestBody {
  pinnedLoad: UnitLoadItem,
  tCardLoads: UnitLoadItem[], // лоады по карте
  unit: UnitItem,  // Юнит куда перемещаем
  date: string,    // Дата куда перемещаем
  timeStart: number //  время куда перемещаем  
  timeFinish: number //  время окончания в случае если это внешний юнит
  today: string // дата раздела,
  userId: number,
  teamId: number,
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  const db = await connectDb();
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const unitRepository = getTypedRepository(db, 'UnitTable', UnitTable);
  const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
  const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
  const tCardProductRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
  const productRepository = getTypedRepository(db, 'ProductTable', ProductTable);
  const tCardOperationRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
  const unitExceptionsRepository = getTypedRepository(db, 'UnitExceptionTable', UnitExceptionTable);
  const tCardStageRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
  const actionRepository = getTypedRepository(db, 'ActionTable', ActionTable);
  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {

      // ПЕРЕПЛАНИРОВАНИЕ по перемещению лоада
      case 'POST':
        const { pinnedLoad, tCardLoads, unit, date, timeStart, timeFinish, today, userId, teamId } = req.body as RequestBody;
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
        const tCard = await getTCardFull(
          Number(userId), locale,
          Number(teamId),
          pinnedLoad.id_tCard,
          tCardRepository,
          tCardOperationRepository,
          tCardProductRepository,
          tCardStageRepository,
          productRepository,
          actionRepository)

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
        const dependentOperationsIds = getDependentOperationsIds(Number(userId), locale, tCard, oper);
        // Формируем массив по карте без лоадов этой операции и зависимых от нее
        const cardLoadsWithoutOperEndDep = tCardLoads.filter(load =>
          !(load.id_oper === oper.id || dependentOperationsIds.includes(load.id_oper as number))
        );

        // также для сохранения истории мы по этой операции и зависимым операциям должны оставить все отмененные бракованные и готовые
        const cardLoadsOperEndDepHistory = tCardLoads.filter(load =>
          !(load.status === StatusEnum.prepared || load.status === StatusEnum.planed)
          && (load.id_oper === oper.id || dependentOperationsIds.includes(load.id_oper as number))
        );

        // сортируем по возрастанию
        cardLoadsWithoutOperEndDep.sort((a, b) =>
          a.date.localeCompare(b.date) || a.timeStart - b.timeStart
        );

        let planedCardLoads = [...cardLoadsWithoutOperEndDep, ...cardLoadsOperEndDepHistory];

        // получаем момент готовности входящих запчастей и не раньше сегодня  и не раньше входящего старта
        const readySourceMoment: { date: string; time: number } | undefined = getOperationReadyMoment(oper, tCard, cardLoadsWithoutOperEndDep, date, timeStart, today)

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
          const operloads = tCardLoads.filter(load => load.id_oper === pinnedLoad.id_oper);
          // сортируем по возрастанию
          operloads.sort((a, b) =>
            a.date.localeCompare(b.date) || a.timeStart - b.timeStart
          );
          const loadStart = operloads[0];
          const loadFinish = operloads[operloads.length - 1];

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
                // loadInfo: (loadStart.loadInfo) ? { ...loadStart.loadInfo, koef: 1 } : undefined
                loadInfo: { ...loadStart.loadInfo, koef: 1 }
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
                // loadInfo: (loadFinish.loadInfo) ? { ...loadFinish.loadInfo, koef: 1 } : undefined
                loadInfo: { ...loadFinish.loadInfo, koef: 1 },
              })
            //
            // перепланируем зависимые лоады
            // запросим юниты
            const units_ = await getUnits(Number(userId), locale, Number(teamId), unitRepository)

            // запросим действия юнитов
            const unitActions_ = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository)

            // запросим расписание компании
            const shedule_ = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)
           
            if (!shedule_) {
              res.status(200).json({
                success: false,
                message: "Ошибка, не найдено расписание команды",
              });
              break;
            }
            //  получим исключения рабочего времени юнитов         
            const exceptionItems = await getUnitExceptions(Number(userId), locale, Number(teamId), unitExceptionsRepository)

            //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
            const unitLoadItemsBD = await getUnitLoads(
              Number(userId),
              locale,
              Number(teamId),
              units_,
              unitLoadRepository,
              unitActionsRepository
            )
            //  уберем из нее лоады нашей карты
            let unitLoadItemsFull = unitLoadItemsBD.filter(lo => pinnedLoad.id_tCard !== lo.id)
            //  и добавим часть лоадов ко торые не меняются + наш перетащенный
            unitLoadItemsFull = [...unitLoadItemsFull, ...planedCardLoads];


            // Планируем зависимые операции
            const resultPlaningNextOper = planTCardFromOperINC(Number(userId), locale, dependentOperationsIds, tCard, units_, unitActions_, shedule_, unitLoadItemsFull, exceptionItems, today)
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
            const finishLoad = tCardLoads.find(lo => lo.id_oper === pinnedLoad.id_oper && lo.isOuterFinish);
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
                // loadInfo: (loadStart.loadInfo) ? { ...loadStart.loadInfo, koef: 1 } : undefined
                loadInfo: { ...loadStart.loadInfo, koef: 1 }
              })
            //  финишный оставляю как есть            
            planedCardLoads.push(loadFinish);
          }


          // 3. перетаскиваем с внешнего на внешний и если корректируемый лоад уже финишный
          if ((pinnedLoad.isOuterFinish && pinnedLoad.unit.belong === UnitBelongEnum.outer)) {

            // проверяем чтобы начало не было позже хваста операции
            const startLoad = tCardLoads.find(lo => lo.id_oper === pinnedLoad.id_oper && lo.isOuterStart);
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
                loadInfo: { ...loadFinish.loadInfo, koef: 1 }
              })

            // Далее перепланируем начиная с последующих операций

            // запросим юниты
            const units_ = await getUnits(Number(userId), locale, Number(teamId), unitRepository)

            // запросим действия юнитов
            const unitActions_ = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository)

            // запросим расписание компании
            const shedule_ = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)
           
            if (!shedule_) {
              res.status(200).json({
                success: false,
                message: "Ошибка, не найдено расписание команды",
              });
              break;
            }
            //  получим исключения рабочего времени юнитов         
            const exceptionItems = await getUnitExceptions(Number(userId), locale, Number(teamId), unitExceptionsRepository)
            //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
            const unitLoadItemsBD = await getUnitLoads(
              Number(userId),
              locale,
              Number(teamId),
              units_,
              unitLoadRepository,
              unitActionsRepository)

            //  уберем из нее лоады нашей карты
            let unitLoadItemsFull = unitLoadItemsBD.filter(lo => pinnedLoad.id_tCard !== lo.id)
            //  и добавим часть лоадов ко торые не меняются + наш перетащенный
            unitLoadItemsFull = [...unitLoadItemsFull, ...planedCardLoads];


            // Планируем карту начиная с нашей операции исключая ее саму
            const resultPlaningNextOper = planTCardFromOperINC(Number(userId), locale, dependentOperationsIds, tCard, units_, unitActions_, shedule_, unitLoadItemsFull, exceptionItems, today)
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
          const unitActions_ = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository)

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
          const units_ = await getUnits(Number(userId), locale, Number(teamId), unitRepository)

          // запросим расписание компании
          const shedule_ = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)
          
          if (!shedule_) {
            res.status(200).json({
              success: false,
              message: "Ошибка, не найдено расписание команды",
            });
            break;
          }
          //  получим исключения рабочего времени юнитов         
          const exceptionItems = await getUnitExceptions(Number(userId), locale, Number(teamId), unitExceptionsRepository)
          //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
          const unitLoadItemsBD = await getUnitLoads(
            Number(userId),
            locale,
            Number(teamId),
            units_,
            unitLoadRepository,
            unitActionsRepository)
          //  уберем из нее лоады нашей карты
          let unitLoadItemsFull = unitLoadItemsBD.filter(lo => tCard.id !== lo.id)
          //  и добавим  лоады которые не надо перепланировать из этой карты
          unitLoadItemsFull = [...unitLoadItemsFull, ...planedCardLoads];

          // Планируем нашу операцию на юните
          const resultPlaningOper = planOperOnUnit(Number(userId), locale, oper, tCard, unit, unitActions_, shedule_, unitLoadItemsFull, exceptionItems, today, readySourceMoment.date, readySourceMoment.time)
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
          const resultPlaningNextOper = planTCardFromOperINC(Number(userId), locale, dependentOperationsIds, tCard, units_, unitActions_, shedule_, unitLoadItemsFull, exceptionItems, today)
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
    console.error('Ошибка подключения или выполнения запроса (pre-moveload-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}


export default withAuth(handler)
