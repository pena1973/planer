//pages/api/plan/pre-moveload-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import { Repository } from 'typeorm';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getTCardFull, getUnits, getTeamShedule, getUnitLoads, getUnitExceptions, getUnitActions } from './../../../handlers/handlers-get';  // 
import { planTCardFromOperINC, planOperOnUnit, getDependentOperations, getOperationReadyMoment } from './../../../handlers/handlers-plan';  // 
import {  isHoliday,  isWeekend  } from "@/lib/common/utils"

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

import { StatusEnum, TCardItem, UnitItem, UnitLoadItem, UnitBelongEnum, TCardOperationItem, UnitExceptionItem, ScheduleItem, DaysOfWeek } from "./../../../types/types";

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
  try {
    const db = await connectDb();
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


    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

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
            message: t('mes.notCardLoads'),
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
            message: t('mes.tCardNotFound')
          });
          break
        }

        // находим нашу операцию в карте 
        const oper = tCard.tCardOperations?.find(op => op.id === pinnedLoad.id_oper)
        if (!oper) {

          //  logger
          void ulogger.error({
            userId: userId,
            location: "pages/api/plan/pre-moveload-api",
            event: "error",
            message: `Операция по лоаду не найдена pinnedLoad.id_oper: ${pinnedLoad.id_oper}`,
            context: "tCard.tCardOperations?.find(op => op.id === pinnedLoad.id_oper)",
          }).catch(() => { console.error("logger error") });

          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: `${t('mes.tCardOperNotFound')}:  ${pinnedLoad.idc_oper}`,
          });
          return
        }

        //  получаем список операций которые зависимы от нашей  -  их будем перепланировать
        const dependentOperations = getDependentOperations(tCard, oper);

        // // добавлю и нашу операцию тоже
        dependentOperations.push(oper);

        // все id зависимые операции и сама операция
        const allDependentOperationsIds = dependentOperations.map(oper => oper.id as number)

        // Формируем массив лоадов по карте без лоадов этой операции и зависимых от нее (историю тоже не берем)
        const cardLoadsWithoutOperAndDep = tCardLoads.filter(load =>
          !(allDependentOperationsIds.includes(load.id_oper as number)
            // && load.date >= today
          )
        );

        // также для сохранения истории мы по этой операции и зависимым операциям должны оставить все отмененные бракованные и готовые и отмененные
        const cardLoadsOperEndDepHistory = tCardLoads.filter(load =>
          // load.date < today
          !(load.status === StatusEnum.prepared || load.status === StatusEnum.planed)
          && (allDependentOperationsIds.includes(load.id_oper as number))
        );

        const planedCardLoads = [...cardLoadsWithoutOperAndDep, ...cardLoadsOperEndDepHistory];

        // сортируем по возрастанию
        planedCardLoads.sort((a, b) =>
          a.date.localeCompare(b.date) || a.timeStart - b.timeStart
        );

        // получаем момент готовности входящих запчастей и не раньше сегодня  и не раньше входящего старта
        const readySourceMoment: { date: string; time: number } | undefined = getOperationReadyMoment(oper, tCard, cardLoadsWithoutOperAndDep, date, timeStart, today)

        // console.log('readySourceMoment',readySourceMoment)

        if (!readySourceMoment) {
          //  logger
          void ulogger.error({
            userId: userId,
            location: "pages/api/plan/pre-moveload-api",
            event: "error",
            message: `На момент выполнения операции не готовы входящие источники -  oper:${oper}, tCard:${tCard}, cardLoadsWithoutOperEndDep:${cardLoadsWithoutOperAndDep.length}, date:${date}, timeStart:${timeStart}, today: ${today}`,
            context: "const readySourceMoment: { date: string; time: number } | undefined = getOperationReadyMoment(oper, tCard, cardLoadsWithoutOperEndDep, date, timeStart, today)",
          }).catch(() => { console.error("logger error") });

          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,

            message: ` ${t('mes.operInnNotReady')}:  ${tCard.idc}`,
          });
          return
        }

        // если цель перетаскивания это внешний юнит смотрим начальный или конечный лоад операции
        // операция на внешнем юните имеет только два лоада стартовый и финишный и не имеет ретула
        // продолжительность не зависит от duration а это чисто договоренность с исполнителем
        if (unit.belong === UnitBelongEnum.outer) {
          const resultOuter = await moveToOuterUnit(userId, locale, teamId, unit, tCard, tCardLoads, pinnedLoad,
            planedCardLoads, readySourceMoment, allDependentOperationsIds,
            today, date, timeStart, timeFinish,
            unitRepository, unitActionsRepository, teamScheduleRepository, unitExceptionsRepository, unitLoadRepository);
          res.status(200).json(resultOuter);
        }
        // внутренний
        else {


          const resultInner = await moveToInnerUnit(userId, locale, teamId, unit, tCard, oper,
            planedCardLoads, readySourceMoment, date, timeStart, allDependentOperationsIds, today,
            unitRepository, unitActionsRepository, teamScheduleRepository, unitExceptionsRepository, unitLoadRepository);
          res.status(200).json(resultInner);
        }
        break;
      default:
        res.status(405).json({ error: 'Method not supported.' });
    }
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/plan/pre-moveload-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

 export default withAuth(handler)

async function moveToOuterUnit(
  userId: number,
  locale: string,
  teamId: number,
  unit: UnitItem,
  tCard: TCardItem,
  tCardLoads: UnitLoadItem[],
  pinnedLoad: UnitLoadItem,
  planedCardLoads: UnitLoadItem[],
  readySourceMoment: { date: string; time: number },
  allDependentOperationsIds: number[],
  today: string,
  date: string,    // Дата куда перемещаем
  timeStart: number, //  время куда перемещаем  
  timeFinish: number, //  время окончания в случае если это внешний юнит
  unitRepository: Repository<UnitTable>,
  unitActionsRepository: Repository<UnitActionTable>,
  teamScheduleRepository: Repository<TeamScheduleTable>,
  unitExceptionsRepository: Repository<UnitExceptionTable>,
  unitLoadRepository: Repository<UnitLoadTable>,


): Promise<{ success: boolean, tCardLoads?: UnitLoadItem[], message: string, }> {

  const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

  // запросим юниты
  const units_ = await getUnits(Number(userId), locale, Number(teamId), unitRepository)

  // запросим действия юнитов 
  const unitActions_ = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository)

  // запросим расписание компании
  const shedule = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)

  if (!shedule) {
    return {
      success: false,
      message: t('mes.sheduleNotFound'),
    };
  }

  //  получим исключения рабочего времени юнитов (для зависимых операций - они остаются на выполнении у внутренних)         
  const exceptionItems = await getUnitExceptions(Number(userId), locale, Number(teamId), unitExceptionsRepository)

  // если перетаскиваем на внешний
  // то старт и финиш операции не меняем  и считываем как был из старых лоадов со статусом препаред
  const operloads = tCardLoads.filter(load => load.id_oper === pinnedLoad.id_oper && load.status === StatusEnum.prepared);

  // сортируем по возрастанию
  operloads.sort((a, b) =>
    a.date.localeCompare(b.date) || a.timeStart - b.timeStart
  );

  // const loadStart = operloads[0];
  // const oper  = tCard.tCardOperations?.find(op=> op.id===loadStart.id_oper)
  // const dur = oper?.duration?oper.duration/60000:5 
  // const loadFinish = operloads[operloads.length - 1];

  const loadStart = operloads[0];
  const loadFinish = operloads[operloads.length - 1];

  // реальная длительность операции по старым лоадам (с учётом разрыва по дням)
  const toMs = (d: string, minutes: number) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, (m || 1) - 1, day || 1, 0, 0, 0, 0).getTime() + minutes * 60000;
  };

  const startMs = toMs(loadStart.date, loadStart.timeStart);
  const finishMs = toMs(loadFinish.date, loadFinish.timeFinish);

  // фактическая длительность операции (минуты)
  const dur = Math.max(5, Math.round((finishMs - startMs) / 60000));


  //  перетаскиваем с с внутреннего на внешний
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
        loadInfo: { ...loadStart.loadInfo, koef: 1 }
      })

    // // Формируем финишный лоад 
    // planedCardLoads.push(
    //   {
    //     ...loadFinish,
    //     unit: unit,
    //     isRetool: false,
    //     date: readySourceMoment.date,
    //     timeStart: readySourceMoment.time+dur - 5,
    //     timeFinish: readySourceMoment.time+dur,
    //     isPinned: true,
    //     isOuterFinish: true,
    //     loadInfo: { ...loadFinish.loadInfo, koef: 1 },
    //   })

    // --- ЗДЕСЬ считаем финиш по рабочему расписанию компании + юнита ---
    // вспомогательный util: добавление дней к дате "YYYY-MM-DD"
    function addDays(date: string, days: number): string {
      const [y, m, d] = date.split("-").map(Number);
      const dt = new Date(y, (m || 1) - 1, (d || 1) + days);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yy}-${mm}-${dd}`;
    }
    
    // рабочие интервалы для конкретной даты с учётом расписания компании,
    // выходных/праздников, индивидуальных рабочих дней и исключений юнита
      // рабочий отрезок в минутах от начала дня
    type WorkSegment = { start: number; end: number };

    function getWorkSegmentsForDate(
      date: string,
      unit: UnitItem,
      schedule: ScheduleItem,
      exceptionItems: UnitExceptionItem[],
    ): WorkSegment[] {
      let segments: WorkSegment[] = [];

      // --- 1) Определяем базовый рабочий интервал по расписанию ---

      let dayStart: number | null = null;
      let dayEnd: number | null = null;

      // если есть индивидуальный рабочий день в schedule.workdays — он приоритетнее
      const wd = schedule.workdays?.find(w => w.date === date);
      if (wd && wd.timeStart < wd.timeFinish) {
        dayStart = wd.timeStart;
        dayEnd = wd.timeFinish;
      } else {
        const holiday = isHoliday(date, schedule);
        const weekend = isWeekend(date, schedule);

        if (!holiday && !weekend && schedule.timeStartWork < schedule.timeFinishWork) {
          dayStart = schedule.timeStartWork;
          dayEnd = schedule.timeFinishWork;
        }
      }

      if (dayStart === null || dayEnd === null || dayEnd <= dayStart) {
        return [];
      }

      segments.push({ start: dayStart, end: dayEnd });

      // --- 2) Вспомогательная функция вычитания интервала ---
      const subtractInterval = (
        base: WorkSegment[],
        start: number,
        end: number
      ): WorkSegment[] => {
        const result: WorkSegment[] = [];
        for (const seg of base) {
          if (end <= seg.start || start >= seg.end) {
            // нет пересечения
            result.push(seg);
            continue;
          }
          if (start > seg.start) {
            result.push({ start: seg.start, end: start });
          }
          if (end < seg.end) {
            result.push({ start: end, end: seg.end });
          }
        }
        return result;
      };

      // --- 3) Вычитаем общие перерывы компании ---
      if (Array.isArray(schedule.breaks)) {
        for (const br of schedule.breaks) {
          const bs = br.timeStart ;
          const be = br.timeFinish;
          if (be > bs) {
            segments = subtractInterval(segments, bs, be);
          }
        }
      }

      // --- 4) Вычитаем исключения конкретного юнита на эту дату ---
      const unitExcs = exceptionItems.filter(
        ex => ex.unitId === unit.id && ex.date === date
      );
      for (const ex of unitExcs) {
        if (ex.timeFinish > ex.timeStart) {
          segments = subtractInterval(segments, ex.timeStart, ex.timeFinish);
        }
      }

      return segments
        .filter(seg => seg.end > seg.start)
        .sort((a, b) => a.start - b.start);
    }

    function calcFinishBySchedule(
      startDate: string,
      startTime: number,
      durMinutes: number,
    ): { finishDate: string; finishTime: number } {
      let rest = durMinutes;
      let curDate = startDate;
      let curTime = startTime;

      // безопасный ограничитель, чтобы не залететь в бесконечный цикл
      for (let guard = 0; guard < 365 * 10; guard++) {
        // здесь используем уже существующие переменные unit, shedule, exceptionItems        
        const segments = getWorkSegmentsForDate(curDate, unit, shedule!, exceptionItems);
        // берём только сегменты, которые ещё впереди текущего времени
        const segmentsToday = segments
          .filter(seg => seg.end > curTime)
          .map(seg => ({
            start: Math.max(seg.start, curTime),
            end: seg.end,
          }));

        for (const seg of segmentsToday) {
          const available = seg.end - seg.start;
          if (available <= 0) continue;

          if (rest <= available) {
            // операция заканчивается внутри этого сегмента
            const finishTime = seg.start + rest;
            return { finishDate: curDate, finishTime };
          }

          // не хватило, вычитаем и идём дальше
          rest -= available;
          curTime = seg.end;
        }

        // если в этот день не уложились — переходим к следующему
        curDate = addDays(curDate, 1);
        curTime = 0;
      }

      // fallback: если вдруг что-то пошло не так — просто вернём +dur от старта
      return {
        finishDate: startDate,
        finishTime: startTime + durMinutes,
      };
    }

    const { finishDate, finishTime } = calcFinishBySchedule(
      readySourceMoment.date,
      readySourceMoment.time,
      dur,
    );


    // Формируем финишный лоад с учётом расписания
    planedCardLoads.push({
      ...loadFinish,
      unit: unit,
      isRetool: false,
      date: finishDate,
      timeStart: finishTime - 5,
      timeFinish: finishTime,
      isPinned: true,
      isOuterFinish: true,
      loadInfo: { ...loadFinish.loadInfo, koef: 1 },
    });


    ////////////// перепланируем зависимые лоады

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
    let unitLoadItemsFull = unitLoadItemsBD.filter(lo => pinnedLoad.id_tCard !== lo.id_tCard)
    //  и добавим часть лоадов ко торые не меняются + наш перетащенный
    unitLoadItemsFull = [...unitLoadItemsFull, ...planedCardLoads];


    // Планируем зависимые операции
    const resultPlaningNextOper = planTCardFromOperINC(Number(userId), locale, allDependentOperationsIds, tCard, units_, unitActions_, shedule, unitLoadItemsFull, exceptionItems, today)

    if (!resultPlaningNextOper.success) {
      //  logger
      void ulogger.error({
        userId: userId,
        location: "pages/api/plan/pre-moveload-api",
        event: "error",
        message: `allDependentOperationsIds:${allDependentOperationsIds}, tCard:${tCard}, units_:${units_}, unitActions_:${unitActions_}, shedule:${shedule}, unitLoadItemsFull:${unitLoadItemsFull.length}, exceptionItems:${exceptionItems}, today:${today} `,
        context: "Зависимые операции planTCardFromOperINC(Number(userId), locale, allDependentOperationsIds, tCard, units_, unitActions_, shedule, unitLoadItemsFull, exceptionItems, today)",
      }).catch(() => { console.error("logger error") });
      return {
        success: false,
        message: resultPlaningNextOper.message,
      };
    }
    planedCardLoads = [...planedCardLoads, ...resultPlaningNextOper.planedCardLoads]

  }

  // 2. перетаскиваем с внешнего на внешний и если корректируемый лоад уже стартовый 
  if ((pinnedLoad.isOuterStart && pinnedLoad.unit.belong === UnitBelongEnum.outer)) {

    // проверяем чтобы начало не было позже хваста операции
    const finishLoad = tCardLoads.find(lo => lo.id_oper === pinnedLoad.id_oper && lo.isOuterFinish);
    if (!finishLoad) {

      return {
        success: false,
        message: `${t('mes.operFinishLoadNotFound')}: ${tCard.idc}`,
      }
    }

    if (finishLoad.date < date || finishLoad.date === date && finishLoad.timeFinish < timeStart) {

      return {
        success: false,
        tCardLoads: tCardLoads,
        message: `${t('mes.impossibleOperFinishEarlierOperStart')}: C-${tCard.idc}`,
      }
    }
    //Здесь Остановилась
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
      return {
        success: false,
        tCardLoads: tCardLoads,
        // message: "Не найден лоад начала операции С-" + tCard.idc,
        message: `${t('mes.operStartLoadNotFound')}: C-${tCard.idc}`,
      }
    }

    if (startLoad.date > date || startLoad.date === date && startLoad.timeStart > timeStart) {
      return {
        success: false,
        tCardLoads: tCardLoads,
        // message: "Нельзя начало операции сделать позже окончания операции С-" + tCard.idc,
        message: `${t('mes.impossibleOperFinishEarlierOperStart')}: C-${tCard.idc}`,
      }
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
    const shedule = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)

    if (!shedule) {
      return {
        success: false,
        // message: "Ошибка, не найдено расписание команды",
        message: t('mes.sheduleNotFound'),
      };
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
    const resultPlaningNextOper = planTCardFromOperINC(Number(userId), locale, allDependentOperationsIds, tCard, units_, unitActions_, shedule, unitLoadItemsFull, exceptionItems, today)
    //  Если не удалось запланировать
    if (!resultPlaningNextOper.success) {
      return {
        success: false,
        // tCardLoads: tCardLoads,
        message: resultPlaningNextOper.message,
      };
    }
    planedCardLoads = [...planedCardLoads, ...resultPlaningNextOper.planedCardLoads]
  }

  return {
    success: true,
    tCardLoads: planedCardLoads,
    message: "",
  };;
}


async function moveToInnerUnit(
  userId: number,
  locale: string,
  teamId: number,
  unit: UnitItem,
  tCard: TCardItem,
  oper: TCardOperationItem,
  planedCardLoads: UnitLoadItem[],
  readySourceMoment: { date: string; time: number },
  needDate: string,
  needTime: number,
  allDependentOperationsIds: number[],
  today: string,
  unitRepository: Repository<UnitTable>,
  unitActionsRepository: Repository<UnitActionTable>,
  teamScheduleRepository: Repository<TeamScheduleTable>,
  unitExceptionsRepository: Repository<UnitExceptionTable>,
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<{ success: boolean, tCardLoads?: UnitLoadItem[], message: string, }> {

  const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

  // запросим действия юнитов
  const unitActions_ = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository)

  // проверяем выполняет ли выбранный юнит эту операцию
  const actions = unitActions_.filter(ac => ac.unitId === unit.id)
  const foundAction = actions.find(ac => ac.action.id === oper.action.id)
  if (!foundAction) {
    return {
      success: false,
      message: `${t('mes.theUnitcantPerformOperation')} unit: ${unit.title} action: ${oper.action.title}`,
    }
  }

  // запросим юниты
  const units_ = await getUnits(Number(userId), locale, Number(teamId), unitRepository)

  // запросим расписание компании
  const shedule = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)

  if (!shedule) {
    return { success: false, message: t('mes.sheduleNotFound'), };
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
  const resultPlaningOper = planOperOnUnit(Number(userId), locale, oper, tCard, unit, unitActions_, shedule, unitLoadItemsFull, exceptionItems, today, readySourceMoment.date, readySourceMoment.time)

  //  Если не удалось запланировать
  if (!resultPlaningOper.success) {
    return { success: false, message: resultPlaningOper.message, };
  }

  // если операция спланировалась добавим ее лоады и  планируем все последующие операции
  unitLoadItemsFull = [...unitLoadItemsFull, ...resultPlaningOper.operLoads];
  planedCardLoads = [...planedCardLoads, ...resultPlaningOper.operLoads];
  // планируем все последующие операции  исключая пришпиленные

  // Планируем карту начиная с нашей операции (есключая ее саму)
  const dependentOperationsIds = allDependentOperationsIds.filter(o => o !== oper.id);
  const resultPlaningNextOper = planTCardFromOperINC(Number(userId), locale, dependentOperationsIds, tCard, units_, unitActions_, shedule, unitLoadItemsFull, exceptionItems, today)
  //  Если не удалось запланировать
  if (!resultPlaningNextOper.success) {

    return { success: false, message: resultPlaningNextOper.message, };
  }
  planedCardLoads = [...planedCardLoads, ...resultPlaningNextOper.planedCardLoads]

  let message = "";
  if (readySourceMoment.date > needDate || (readySourceMoment.date === needDate && readySourceMoment.time > needTime))
    // message = "Невозможно начать операцию в указанное время, не готовы входящие источники, интервал сдвинут"
    message = t('mes.loadShifted');

  return {
    success: true,
    tCardLoads: planedCardLoads,
    message: message,
  };
}