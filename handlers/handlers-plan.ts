import { ulogger } from "./../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import {
  TCardProductItem, TCardOperationItem, ProductItem,
  TCardItem, UnitLoadItem, UnitExceptionItem,
  CalendarItem, TimeTypeEnum, StatusEnum,
  UnitItem, ScheduleItem, DaysOfWeek, UnitBelongEnum,
  UnitActionItem, ReadyProduct
} from "./../types/types";

import { YYYYMMDD } from "@/lib/common/utils"

import { getCurrentDateInDate, getTimeZoneDateFromDateString, addDaysInZone } from "./../lib/common/timezone"
// функция генерации loadIdc - уникальный идентификатор пока лоад не записан в базу
const getLoadIdc = (
  tCard: TCardItem,
  operation: TCardOperationItem,
  seg: {
    date: string,
    start: number;
    finish: number,
    isRetool: boolean
  }): number => {
  return Number(`${tCard.id}${operation.idc}${Number(seg.date.replace(/-/g, ''))}${seg.start}`)
}

import { generateUniqueIdc } from './../lib/common/utils'
// import TCardProduct from "@/components/cards/TCardProducts/TCardProduct/tCardProduct";
// import Product from "@/components/cards/Products/Product/product";
// генерация привычной нам даты - ее использую как id дня
const idDay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');  // День с ведущим нулем
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Месяц с ведущим нулем
  const year = date.getFullYear();  // Год

  return `${day}.${month}.${year}`;  // Возвращаем строку в формате "день.месяц.год"
};

//  функция определяемт входит ли  дата в список дат дополнительного времени работы
const isAdditionalTime = (date: Date, schedule: ScheduleItem): boolean => {

  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  // const dateString = date.toLocaleDateString('en-CA').split(',')[0];
  const dateString = YYYYMMDD(date);

  // Проверяем, есть ли дата в массиве праздников
  if (schedule.teamId)
    return schedule.workdays.some(workday =>
      YYYYMMDD(workday.date) === dateString
      // new Date(workday.date).toLocaleDateString('en-CA').split(',')[0] === dateString
    ); else return false
}
//  функция определяемт входит ли  дата в список выходных расписания
const isWeekend = (date: Date, schedule: ScheduleItem): boolean => {
  const dayOfWeek = date.getDay();  // Получаем день недели (0 - воскресенье, 6 - суббота)    

  let dayString = DaysOfWeek.SUNDAY;

  switch (dayOfWeek) {
    case 1:
      dayString = DaysOfWeek.MONDAY;
      break;
    case 2:
      dayString = DaysOfWeek.TUESDAY;
      break;
    case 3:
      dayString = DaysOfWeek.WEDNESDAY;
      break;
    case 4:
      dayString = DaysOfWeek.THURSDAY;
      break;
    case 5:
      dayString = DaysOfWeek.FRIDAY;
      break;
    case 6:
      dayString = DaysOfWeek.SATURDAY;
      break;
    default:
      dayString = DaysOfWeek.SUNDAY;
      break;
  }

  // Проверяем, является ли день выходным
  if (schedule.teamId) return schedule.weekends.includes(dayString);
  else return false
}
//  функция определяемт входит ли  дата в список праздников расписания
const isHoliday = (date: Date, schedule: ScheduleItem): boolean => {
  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  // const dateString = date.toLocaleDateString('en-CA').split(',')[0];
  const dateString = YYYYMMDD(date);

  // Проверяем, есть ли дата в массиве праздников
  if (schedule.teamId)
    return schedule.holidays.some(holiday =>
      YYYYMMDD(holiday) === dateString
      // new Date(holiday).toLocaleDateString('en-CA').split(',')[0] === dateString
    ); else return false
}
// генерация одного дня на шкале
const generateCalendarItemOnServer = (day: string, schedule: ScheduleItem): CalendarItem => {

  // const currentDate = new Date(day);  // Убираю мутабельность 
  // currentDate.setHours(0, 0, 0, 0);

  const currentDate = getTimeZoneDateFromDateString(day, schedule.timeZone)

  const _isWeekend = isWeekend(currentDate, schedule);  // День недели для учета выходных
  const _isHoliday = isHoliday(currentDate, schedule);  // День недели для учета Праздников
  const _isAdditionalTime = isAdditionalTime(currentDate, schedule);  // День недели для учета Праздников

  let timeStartWork = _isWeekend || _isHoliday ? 0 : schedule.timeStartWork;
  let timeFinishWork = _isWeekend || _isHoliday ? 0 : schedule.timeFinishWork;
  let breaks = _isWeekend || _isHoliday || (!schedule.teamId) ? [] : [...schedule.breaks];

  if (_isAdditionalTime) {
    const workday = schedule.workdays.find(
      // workday => workday.date === currentDate.toLocaleDateString("en-CA").split(',')[0]);
      workday => workday.date === YYYYMMDD(currentDate));
    // если дата есть, то нужно просто взять дополнительное время из workday  
    if (workday) {
      if (_isWeekend || _isHoliday) {
        timeStartWork = workday.timeStart;
        timeFinishWork = workday.timeFinish;
      } else {
        timeStartWork = Math.min(schedule.timeStartWork, workday.timeStart)
        timeFinishWork = Math.max(schedule.timeFinishWork, workday.timeFinish);
      }
      //  проверим перерывы и если попадают в рабочий период вставим
      breaks = schedule.breaks.filter(breack => breack.timeStart > timeStartWork && breack.timeFinish < timeFinishWork)
    }
  }

  // Создаем объект CalendarItem
  const calendarItem: CalendarItem = {
    idDay: idDay(currentDate),
    // date: new Date(currentDate),  // Текущая дата
    date: day,  // Текущая дата
    mounth: currentDate.getDate() === 1,  // Если это первый день месяца, ставим true
    day: true,  // Указываем, что это день
    timeStartWork: timeStartWork,  // Время начала работы (если не выходной)
    timeFinishWork: timeFinishWork,  // Время окончания работы (если не выходной)
    breaks: breaks,
  };
  return calendarItem;  // Возвращаем один элемент календаря
};

//! получение операций со статусом подготовлен по карте
export const getAllPreparedOperationsIds = (
  tCard: TCardItem
): number[] => {

  if (!tCard.tCardOperations) return [];

  // Фильтруем операции cо статусом Prepared
  const preparedOps = tCard.tCardOperations.filter(op => op.status === StatusEnum.prepared);

  // Возвращаем массив id (предполагается, что op.id всегда определён)
  return preparedOps.map(op => op.id!).filter(id => id !== undefined);
};

// //! Получение зависимых prepared операций
// export const getDependentPreparedOperationsIds = (  
//   tCard: TCardItem,
//   oper: TCardOperationItem
// ): number[] => {
//   if (!tCard.tCardOperations) return [];

//   // Собираем все code выходных продуктов нашей операции
//   const outCode = new Set(oper.out.map(prod => prod.code));

//   // Фильтруем операции карты (исключая саму oper)
//   // и выбираем те, у которых хотя бы один входной продукт (inn)
//   // имеет code, присутствующий в outCode
//   const dependentOps = tCard.tCardOperations.filter(op => {
//     if (op.id === oper.id) return false;
//     return op.inn.some(inp => outCode.has(inp.code));
//   });

//   const preparedOps = dependentOps.filter(op => op.status === StatusEnum.prepared);

//   // Возвращаем массив id (предполагается, что op.id всегда определён)
//   return preparedOps.map(op => op.id!).filter(id => id !== undefined);
// };

// //! Получение всех зависимых planed операций
// export const getDependentPlanedOperationsIds = (  
//   tCard: TCardItem,
//   oper: TCardOperationItem
// ): number[] => {
//   if (!tCard.tCardOperations) return [];

//   // Собираем все code выходных продуктов нашей операции
//   const outCode = new Set(oper.out.map(prod => prod.code));

//   // Фильтруем операции карты (исключая саму oper)
//   // и выбираем те, у которых хотя бы один входной продукт (inn)
//   // имеет code, присутствующий в outCode
//   const dependentOps = tCard.tCardOperations.filter(op => {
//     if (op.id === oper.id) return false;
//     return op.inn.some(inp => outCode.has(inp.code));
//   });

//   const preparedOps = dependentOps.filter(op => op.status === StatusEnum.prepared);

//   // Возвращаем массив id (предполагается, что op.id всегда определён)
//   return preparedOps.map(op => op.id!).filter(id => id !== undefined);
// };


// ! Все зависимые операции по цепочке (все статусы) — возвращаем объекты операций
export const getDependentOperations = (
  tCard: TCardItem,
  oper: TCardOperationItem
): TCardOperationItem[] => {
  const ops = tCard.tCardOperations ?? [];
  if (ops.length === 0) return [];

  // Индекс: входной code -> список операций (кроме исходной)
  const index = new Map<string, TCardOperationItem[]>();
  for (const op of ops) {
    if (op.id === oper.id) continue;
    const inn = op.inn ?? [];
    for (const inp of inn) {
      const c = inp?.code;
      if (c == null) continue;
      const key = String(c);
      const bucket = index.get(key);
      if (bucket) bucket.push(op);
      else index.set(key, [op]);
    }
  }

  // Стартовые коды — все выходные коды исходной операции
  const startCodes = (oper.out ?? [])
    .map(p => p?.code)

  if (startCodes.length === 0) return [];

  // BFS по кодам продуктов
  const queue: string[] = Array.from(new Set(startCodes));
  const seenCodes = new Set(queue);
  const seenOpIds = new Set<number>();
  const result: TCardOperationItem[] = [];

  while (queue.length) {
    const code = queue.shift()!;
    const dependents = index.get(code) ?? [];
    for (const dep of dependents) {
      const id = dep.id;
      if (id == null || seenOpIds.has(id)) continue;

      seenOpIds.add(id);
      result.push(dep); // возвращаем объекты операций

      // расширяем фронт их выходами
      const outs = dep.out ?? [];
      for (const out of outs) {
        const oc = out?.code;
        if (oc == null) continue;
        const next = String(oc);
        if (!seenCodes.has(next)) {
          seenCodes.add(next);
          queue.push(next);
        }
      }
    }
  }

  return result;
};


// поиск  юнита и времени выполнения операции
// выбираем возможного юнита и самый быстрый вариант выполнения
// с учетом временного коэфициента юнита
function findAvailableTimeForOperation(
  userId: number,
  locale: string,
  tCard: TCardItem,
  compatibleuUnits: UnitItem[], // массив юнитов, которые могут выполнить операцию
  unitActions: UnitActionItem[], //  массив операций юнитов
  unitLoadItems: UnitLoadItem[], // массив загрузок юнитов
  operation: TCardOperationItem, // операция (с длительностью в мс)
  startDateStr: string,            // дата для старта выполнения операции (YYYY-MM-DD)
  moment: number,               // момент в который можно стартовать  -  готовы все входящие материалы
  stopDateStr: string,             // дата, после которой планирование не ведётся (90 дней вперед)
  schedule: ScheduleItem,
  exceptionItems: UnitExceptionItem[],
  isPinned: boolean, //  признак того что при планировании надо установить как пришпилен
): { success: boolean, planedUnitLoads: UnitLoadItem[], dateReady: string, timeReady: number, message: string } {

  // tCard, compatibleuUnits, unitActions, updatedUnitLoads, operation, maxDateSource, maxTimeSource, stopDate, shedule_, exceptionItems, isPinned
  const version = generateUniqueIdc();

  // const targetDate = new Date(startDate);
  // targetDate.setHours(0, 0, 0, 0); // Устанавливаем начало дня (00:00:00.000)
  const targetDate = getTimeZoneDateFromDateString(startDateStr, schedule.timeZone)
  const stopDate = getTimeZoneDateFromDateString(stopDateStr, schedule.timeZone)

  if (targetDate.getTime() > stopDate.getTime()) {
    return {
      success: false,
      planedUnitLoads: unitLoadItems,
      dateReady: "",
      timeReady: 0,
      message: `планирование не удалось: нет свободных ресурсов до ${stopDate}`
    };
  }
  // Продолжительность операции в минутах (округлённая вверх)
  const operationDuration = Math.ceil(operation.duration / (1000 * 60));
  const interruptible = operation.action.interruptible;

  // Интерфейс кандидата (для внутреннего использования)
  interface Candidate {
    unit: UnitItem;
    // Сегменты выполнения операции (один или несколько)
    opSegments: { date: string, start: number; finish: number, isRetool: boolean }[];
    duration: number; // общая длительность (retool + выполнение операции)
  }

  // Массив кандидатов, найденных для разных юнитов
  const possibleCandidates: Candidate[] = [];

  // Перебираем каждый совместимый юнит
  for (const unit of compatibleuUnits) {
    const actions = unitActions.filter(ac => ac.unitId === unit.id)
    // Определяем время переналадки и длительность выполнения операции
    const retoolTime = unit.retool; // время переналадки (в минутах)
    const action = actions.find(a => a.action.id === operation.action.id);
    const koef = action ? action.koef : 1;
    const opRequired = operationDuration * koef; // время выполнения операции (без ретула)
    const onPlaned = 0; //- это сколько уже запланировано
    const totalRequired = retoolTime + opRequired; // общее время
    const opSegments = [] as { date: string, start: number; finish: number, isRetool: boolean }[];
    const isRetoolSegmentDefined = (retoolTime === 0)

    // ищем для юнита возможные сегменты операции
    const resultOpSegments = findAvailableSegmentsDay(
      userId,
      locale,
      startDateStr,
      moment,
      stopDateStr,
      opSegments,
      unit,
      retoolTime,
      opRequired,
      onPlaned,
      unitLoadItems,
      schedule,
      exceptionItems,
      interruptible,
      totalRequired,
      isRetoolSegmentDefined)

    // если успешно нашли записываем как кандидата на выполнение  
    if (resultOpSegments.success) {
      const candidate: Candidate = {
        unit,
        opSegments: resultOpSegments.opSegments,
        duration: totalRequired,
      };
      possibleCandidates.push(candidate);
    }
  }

  // Если найдены кандидаты, выбираем того, который завершит операцию раньше.
  if (possibleCandidates.length > 0) {
    possibleCandidates.sort((a, b) => {
      const aLastSegment = a.opSegments.length > 0 ? a.opSegments[a.opSegments.length - 1] : null;
      const bLastSegment = b.opSegments.length > 0 ? b.opSegments[b.opSegments.length - 1] : null;

      // Если у кого-то нет сегментов — считаем их "лучше" (например, раньше)
      if (!aLastSegment && !bLastSegment) return 0;
      if (!aLastSegment) return -1;
      if (!bLastSegment) return 1;

      const aFinish = new Date(aLastSegment.date).getTime() + aLastSegment.finish * 60000;
      const bFinish = new Date(bLastSegment.date).getTime() + bLastSegment.finish * 60000;

      return aFinish - bFinish;
    });

    const bestCandidate = possibleCandidates[0];

    // Формируем итоговый массив загрузок (UnitLoadItem) для победившего юнита
    const updatedUnitLoads: UnitLoadItem[] = [];

    let isFirst = true;
    bestCandidate.opSegments.forEach(seg => {
      const actions_ = unitActions.filter(ac => ac.unitId === bestCandidate.unit.id)
      const action = actions_.find(act => act.id = operation.action.id);
      const koef = (action) ? action.koef : 1;

      updatedUnitLoads.push({
        idc_oper: operation.idc,
        unit: bestCandidate.unit,
        date: seg.date,
        id_tCard: tCard.id,
        timeStart: seg.start,
        timeFinish: seg.finish,
        status: StatusEnum.prepared,
        id_oper: Number(operation.id),
        idc: getLoadIdc(tCard, operation, seg),
        isActive: true,
        isRetool: seg.isRetool,
        loadInfo: { tCardIdc: tCard.idc, tCardDate: tCard.date, title: operation.action.title, duration: Math.round(operation.duration / 60000), interruptible: operation.action.interruptible, koef: koef },
        isPinned: isPinned,
        isOuterStart: false,//  это старт оутсортера, здесь не применяется
        isOuterFinish: false,//  это финиш оутсортера        
        version: version,
        isFirst: seg.isRetool ? false : isFirst
      });

      isFirst = seg.isRetool ? isFirst : false;
    });

    if (updatedUnitLoads.length === 0) {
      return {
        success: false,
        planedUnitLoads: updatedUnitLoads,
        dateReady: "",
        timeReady: 0,
        message: ""
      };
    }

    const finalLoad = updatedUnitLoads[updatedUnitLoads.length - 1];

    return {
      success: true,
      planedUnitLoads: updatedUnitLoads,
      dateReady: finalLoad.date,
      timeReady: finalLoad.timeFinish,
      message: `Планирование не удалось: нет опрераций с указанным временем выполнения`
    };
  }

  return {
    success: false,
    planedUnitLoads: unitLoadItems,
    dateReady: "",
    timeReady: 0,
    message: ` до ${stopDate}
    учитывая время и непрерывность операции, а также коэфициент времени юнитов`
  };
}

// Рекурсия для разбивки операции на промежутки по шкале времени определенного юнита на определенный день
// на выходе имеем сегменты разбивки
function findAvailableSegmentsDay(
  userId: number,
  locale: string,
  // targetDate: Date,
  targetDateStr: string,
  moment: number,  // момент в который можно стартовать  -  готовы все входящие материалы
  stopDateStr: string,
  opSegments_: { date: string, start: number, finish: number, isRetool: boolean }[],
  unit: UnitItem,
  retoolTime: number,
  opRequired: number, // требуемое время  операции
  onPlaned_: number, // уже запланировано
  unitLoadItems: UnitLoadItem[], // массив загрузок юнитов  
  schedule: ScheduleItem,
  exceptionItems: UnitExceptionItem[],
  interruptible: boolean,
  totalRequired: number,
  isRetoolSegmentDefined_: boolean
): {
  success: boolean,
  opSegments: { date: string, start: number, finish: number, isRetool: boolean }[],
  message: string
} {

  const stopDate = getTimeZoneDateFromDateString(stopDateStr, schedule.timeZone)
  const targetDate = getTimeZoneDateFromDateString(targetDateStr, schedule.timeZone)
  // if (targetDate.getTime() > new Date(stopDate).getTime()) {
  if (targetDate.getTime() > stopDate.getTime()) {
    return {
      success: false,
      opSegments: [] as { date: string, start: number, finish: number, isRetool: boolean }[],
      message: `достигнута стоп дата и нет свободных ресурсов до ${stopDateStr}`
    };
  }

  const workDay = generateCalendarItemOnServer(targetDateStr, schedule);
  // Определяем рабочие рамки для данного юнита (по расписанию компании)
  let workStart = workDay.timeStartWork;
  let workEnd = workDay.timeFinishWork;

  // Массив занятых интервалов (будем заполнять его интервалами, когда юнит занят)
  const busyPeriods: { type: TimeTypeEnum; start: number; end: number }[] = [];

  // Проверяем исключения (например, изменённые рамки рабочего дня или дополнительные перерывы)
  const exceptionsWorkDayNext = exceptionItems.filter(elem =>
    // elem.unitId === unit.id && elem.date === targetDate.toLocaleDateString("en-CA")
    elem.unitId === unit.id && elem.date === YYYYMMDD(targetDate)
  );

  if (exceptionsWorkDayNext.length > 0) {
    exceptionsWorkDayNext.forEach(ex => {
      if (ex.type === TimeTypeEnum.work) {
        workStart = ex.timeStart;
        workEnd = ex.timeFinish;
      } else {
        busyPeriods.push({ type: ex.type, start: ex.timeStart, end: ex.timeFinish });
      }
    });
  }


  let onPlaned = onPlaned_; // сколько минут операции запланировано c ретулом

  // в этом  массиве что на вход уже запланирована часть операции
  let opSegments: { date: string, start: number; finish: number, isRetool: boolean }[] = [...opSegments_];

  let isRetoolSegmentDefined = (retoolTime === 0) || isRetoolSegmentDefined_; // ретул определен в интервал


  // Если рабочее время отсутствует – пропускаем день
  // перепрыгиваем на следующий день
  if (workEnd === workStart) {

    const nextDate = addDaysInZone(targetDate, 1, schedule.timeZone)
    const nextDateStr = YYYYMMDD(nextDate);
    // const nextDate = new Date(targetDate)
    // nextDate.setDate(nextDate.getDate() + 1);
    // const nextDateStr = nextDate.toLocaleDateString("en-CA");

    return findAvailableSegmentsDay(
      userId,
      locale,
      nextDateStr,
      0,
      stopDateStr,
      opSegments,
      unit,
      retoolTime,
      opRequired,
      onPlaned,
      unitLoadItems,
      schedule,
      exceptionItems,
      interruptible,
      totalRequired,
      isRetoolSegmentDefined
    )

  };;

  // Получаем уже запланированные операции для данного юнита на targetDate
  // const loads = unitLoadItems.filter(load => load.unit.id === unit.id && load.date === targetDate.toLocaleDateString("en-CA"));
  const loads = unitLoadItems.filter(load => load.unit.id === unit.id && load.date === YYYYMMDD(targetDate));

  loads.forEach(load => {
    busyPeriods.push({ type: TimeTypeEnum.busy, start: load.timeStart, end: load.timeFinish });
  });
  // Добавляем перерывы из календаря  если нет исключений
  if (exceptionsWorkDayNext.length === 0) {
    workDay.breaks.forEach(b => {
      busyPeriods.push({ type: TimeTypeEnum.breack, start: b.timeStart, end: b.timeFinish });
    });
  }

  busyPeriods.sort((a, b) => a.start - b.start);


  let availableStart = Math.max(workStart, moment);

  // если начало выпадает на занятый интервал  сдвигаем начало на окончание занятого интервала
  const currentbusyPeriod = busyPeriods.find(p => p.start <= availableStart && p.end > availableStart)
  if (currentbusyPeriod)
    availableStart = Math.max(availableStart, currentbusyPeriod.end);

  // Итерируем по свободным интервалам, учитывая busyPeriods, чтобы накопить totalRequired минут.

  if (!interruptible) {

    let found = false; // запланировалось
    // Непрерываемая операция: нужно найти один непрерывный свободный интервал для всей операции но можно отделить ретул перерывом

    while (availableStart < workEnd && !found) {
      const nextPeriod = busyPeriods.find(p => p.start >= availableStart);
      const freeEnd = nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd;
      let freeInterval = freeEnd - availableStart;

      //1. убедимся что в найденный интервал влазит ретул
      // если есть и влазит - планируем
      if (freeInterval >= retoolTime && !isRetoolSegmentDefined) {
        // opSegments.push({ date: targetDate.toLocaleDateString("en-CA"), start: availableStart, finish: availableStart + retoolTime, isRetool: true });
        opSegments.push({ date: YYYYMMDD(targetDate), start: availableStart, finish: availableStart + retoolTime, isRetool: true });
        availableStart = availableStart + retoolTime;
        freeInterval = freeInterval - retoolTime
        isRetoolSegmentDefined = true;
      }
      //1. убедимся что в оставшийся интервал влазит операция
      // если есть и влазит - планируем
      if (freeInterval >= opRequired && isRetoolSegmentDefined) {
        // opSegments.push({ date: targetDate.toLocaleDateString("en-CA"), start: availableStart, finish: availableStart + opRequired, isRetool: false });
        opSegments.push({ date: YYYYMMDD(targetDate), start: availableStart, finish: availableStart + opRequired, isRetool: false });
        availableStart += opRequired;
        found = true;
      } else {

        // если не влазит проверяем следующий интервал
        // если  ретул разрывается с самой операцией другой операцией  -  стираем и начинаем заново
        if (nextPeriod?.type === TimeTypeEnum.busy) {
          isRetoolSegmentDefined = (retoolTime === 0) || isRetoolSegmentDefined_; // ретул возвращаем
          opSegments = [] as { date: string, start: number; finish: number, isRetool: boolean }[];
        };
      }

      if (nextPeriod) {
        availableStart = Math.max(availableStart, nextPeriod.end);
      } else {
        break;
      }
    }


    // проверим еще интервал от возможного старта до конца рабочего дня    
    let freeInterval = workEnd - availableStart;
    //1. убедимся что в найденный интервал влазит ретул  и он не
    // если есть и влазит - планируем
    if (freeInterval >= retoolTime && !isRetoolSegmentDefined) {
      // opSegments.push({ date: targetDate.toLocaleDateString("en-CA"), start: availableStart, finish: availableStart + retoolTime, isRetool: true });
      opSegments.push({ date: YYYYMMDD(targetDate), start: availableStart, finish: availableStart + retoolTime, isRetool: true });
      availableStart = availableStart + retoolTime;
      freeInterval = freeInterval - retoolTime
      isRetoolSegmentDefined = true;
    }
    if (!found) {
      //1. убедимся что в оставшийся интервал влазит операция
      // если есть и влазит - планируем
      if (freeInterval >= opRequired && isRetoolSegmentDefined) {
        // opSegments.push({ date: targetDate.toLocaleDateString("en-CA"), start: availableStart, finish: availableStart + opRequired, isRetool: false });
        opSegments.push({ date: YYYYMMDD(targetDate), start: availableStart, finish: availableStart + opRequired, isRetool: false });
        availableStart += opRequired;
        found = true;
      }
    }

    // если в этот день интервалов не нашлось идем на след день
    if (!found) {
      // const nextDate = new Date(targetDate)      
      // nextDate.setDate(nextDate.getDate() + 1);
      // const nextDateStr = nextDate.toLocaleDateString("en-CA");

      const nextDate = addDaysInZone(targetDate, 1, schedule.timeZone)
      const nextDateStr = YYYYMMDD(nextDate);

      return findAvailableSegmentsDay(
        userId,
        locale,
        nextDateStr,
        0,
        stopDateStr,
        opSegments,
        unit,
        retoolTime,
        opRequired,
        onPlaned,
        unitLoadItems,
        schedule,
        exceptionItems,
        interruptible,
        totalRequired,
        isRetoolSegmentDefined
      )
    }


    if (opSegments.length >= 2) {
      const retoolSeg = opSegments[0];
      const opSeg = opSegments[1];
      const opStart = opSeg.start; // начало выполнения операции

      // Ищем период breack между началом ретула и началом операции.
      let breackStartCandidate: number | undefined = undefined;
      busyPeriods.forEach(period => {
        if (period.type === TimeTypeEnum.breack && period.start >= retoolSeg.start && period.start < opStart) {
          if (breackStartCandidate === undefined || period.start < breackStartCandidate) {
            breackStartCandidate = period.start;
          }
        }
      });

      // Если найден breack – ретул заканчивается в его начале, иначе – в начале операции.
      const desiredRetoolFinish = breackStartCandidate !== undefined ? breackStartCandidate : opStart;

      // Определяем, к какому дню относится ретул-сегмент.
      // const currentDay = targetDate.toLocaleDateString("en-CA");
      const currentDay = YYYYMMDD(targetDate);

      if (retoolSeg.date === currentDay) {
        // Если ретул в текущем дне – сдвигаем так, чтобы длина ретула была равна retoolTime,
        // но не раньше рабочего времени.
        const newRetoolStart = Math.max(workStart, desiredRetoolFinish - retoolTime);
        retoolSeg.start = newRetoolStart;
        retoolSeg.finish = desiredRetoolFinish;
      } else {
        // Если ретул запланирован не на текущий день (например, в конце дня, а операция – на следующий),
        // сдвигаем ретул так, чтобы он заканчивался ровно в конце рабочего дня для того дня,
        // к которому он относится.
        // const retoolDate = new Date(retoolSeg.date);
        // const workDayRetool = generateCalendarItemOnServer(retoolDate, schedule);
        const workDayRetool = generateCalendarItemOnServer(retoolSeg.date, schedule);
        const workEndRetool = workDayRetool.timeFinishWork;
        const newRetoolStart = workEndRetool - retoolTime;
        retoolSeg.start = newRetoolStart;
        retoolSeg.finish = workEndRetool;
      }
    }


    return {
      success: true,
      opSegments: opSegments,
      message: ""
    }

  } else {

    // Итерируем по свободным интервалам, учитывая busyPeriods, чтобы накопить totalRequired минут.
    while (availableStart < workEnd && onPlaned < opRequired) {

      // Ищем следующий занятый интервал, начинающийся после availableStart.
      const nextPeriod = busyPeriods.find(p => p.start >= availableStart);
      const freeEnd = nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd;
      let freeInterval = freeEnd - availableStart;
      // если между ретулом и операцией другая операция то двигаем дальше

      // Сначала ретул если есть  и его не прерываем
      if (freeInterval > 0 && !isRetoolSegmentDefined) {

        const timeToUse = Math.min(freeInterval, retoolTime);
        // opSegments.push({ date: targetDate.toLocaleDateString("en-CA"), start: availableStart, finish: availableStart + timeToUse, isRetool: true });
        opSegments.push({ date: YYYYMMDD(targetDate), start: availableStart, finish: availableStart + timeToUse, isRetool: true });
        availableStart = availableStart + timeToUse;
        freeInterval = freeInterval - timeToUse
        isRetoolSegmentDefined = (timeToUse === retoolTime) || isRetoolSegmentDefined_;

        // если между ретулом и операцией вклинивается другая операция  сброс и ищем дальше
        if (freeInterval === 0 && nextPeriod?.type === TimeTypeEnum.busy) {
          isRetoolSegmentDefined = isRetoolSegmentDefined_;
          onPlaned = 0;
          opSegments = [] as { date: string, start: number; finish: number, isRetool: boolean }[];
        };

      }

      if (freeInterval > 0 && isRetoolSegmentDefined) {
        const timeToUse = Math.min(freeInterval, opRequired - onPlaned);
        if (timeToUse > 0) {
          // opSegments.push({ date: targetDate.toLocaleDateString("en-CA"), start: availableStart, finish: availableStart + timeToUse, isRetool: false });
          opSegments.push({ date: YYYYMMDD(targetDate), start: availableStart, finish: availableStart + timeToUse, isRetool: false });
          onPlaned += timeToUse;
          availableStart += timeToUse;
          if (onPlaned === opRequired) break;

          // если вклинивается другая операция то сброс и ищем дальше
          if (nextPeriod?.type === TimeTypeEnum.busy) {
            onPlaned = 0;
            opSegments = [] as { date: string, start: number; finish: number, isRetool: boolean }[];
            isRetoolSegmentDefined = false;
          };
        }
      }

      if (nextPeriod) {
        availableStart = Math.max(availableStart, nextPeriod.end);
      } else {
        break;
      }
    }

    // Здесь проверка оставшегося времени до конца рабочего дня
    if (onPlaned < opRequired) {
      // проверим еще интервал от возможного старта до конца рабочего дня    
      let freeInterval = workEnd - availableStart;
      //1. убедимся что в найденный интервал влазит ретул
      // если есть и влазит - планируем
      if (freeInterval > 0 && !isRetoolSegmentDefined) {
        const timeToUse = Math.min(freeInterval, retoolTime);
        // opSegments.push({ date: targetDate.toLocaleDateString("en-CA"), start: availableStart, finish: availableStart + timeToUse, isRetool: true });
        opSegments.push({ date: YYYYMMDD(targetDate), start: availableStart, finish: availableStart + timeToUse, isRetool: true });
        availableStart = availableStart + timeToUse;
        freeInterval = freeInterval - timeToUse
        isRetoolSegmentDefined = (timeToUse === retoolTime);
      }


      if (freeInterval > 0 && isRetoolSegmentDefined) {
        const timeToUse = Math.min(freeInterval, opRequired - onPlaned);
        if (timeToUse > 0) {
          // opSegments.push({ date: targetDate.toLocaleDateString("en-CA"), start: availableStart, finish: availableStart + timeToUse, isRetool: false });
          opSegments.push({ date: YYYYMMDD(targetDate), start: availableStart, finish: availableStart + timeToUse, isRetool: false });
          onPlaned += timeToUse;
          availableStart += timeToUse;
        }
      }

    }

    if (onPlaned < opRequired) {
      // const nextDate = new Date(targetDate)
      // nextDate.setDate(nextDate.getDate() + 1);
      // const nextDateStr = nextDate.toLocaleDateString("en-CA");

      const nextDate = addDaysInZone(targetDate, 1, schedule.timeZone)
      const nextDateStr = YYYYMMDD(nextDate);

      return findAvailableSegmentsDay(
        userId,
        locale,
        nextDateStr,
        0,
        stopDateStr,
        opSegments,
        unit,
        retoolTime,
        opRequired,
        onPlaned,
        unitLoadItems,
        schedule,
        exceptionItems,
        interruptible,
        totalRequired,
        isRetoolSegmentDefined
      )
    }

    return {
      success: true,
      opSegments: opSegments,
      message: ""
    }
  }
}

const doLoopProductsOper = (
  readyProducts: ReadyProduct[],
  operation: TCardOperationItem,
  dateFinish: string,
  timeFinish: number
): ReadyProduct[] => {
  if (dateFinish !== "") {
    const readyProductsOut = operation.out.map(elem => {
      return {
        id: elem.id,
        product: elem.product,
        code: elem.code,
        qtu: elem.qtu,
        date: dateFinish,
        time: timeFinish,
        reserved: 0,
        reservedTo: NaN
      }
    });
    readyProducts = [...readyProducts, ...readyProductsOut]
    //  удаляем исходники которые были под операцию зарезервированы          
    readyProducts = readyProducts.filter(elem => elem.reservedTo !== operation.idc);
  }

  return readyProducts;
}

//! В этом модуле делаем РАСЧЕТ ПЛАНИРОВАНИЯ, 
// для массива операций по карте
// возврашаем готовую загрузку
export const planTCardFromOperINC = (
  userId: number,
  locale: string,
  operationsToPlanIds: number[],
  tCard: TCardItem,
  units: UnitItem[],
  unitActions: UnitActionItem[],
  shedule_: ScheduleItem,
  unitLoads: UnitLoadItem[], //  вся загрузка которую надо учесть
  exceptionItems: UnitExceptionItem[],
  today_: string,
  // вернем то что запланировали
): { success: boolean, planedCardLoads: UnitLoadItem[], message: string } => {

  const t = getServerT(locale, 'sermes');

  try {

    if (operationsToPlanIds.length === 0)
      return {
        success: true,
        planedCardLoads: [] as UnitLoadItem[],
        message: t('mes.noOperToplan')
      };

    let updatedUnitLoads = [...unitLoads];
    let planedCardLoads: UnitLoadItem[] = [];

    const today = getTimeZoneDateFromDateString(today_, shedule_.timeZone)

    const stopDate_ = getCurrentDateInDate(shedule_.timeZone)
    stopDate_.setDate(stopDate_.getDate() + 90);
    const stopDateStr = YYYYMMDD(stopDate_);

    // массив готовых продуктов и дата время готовности каждого продукта
    // стартуем с продуктов которые  берутся со склада  
    let readyProducts: ReadyProduct[] = [];

    if (tCard.tCardMaterials)
      readyProducts = tCard.tCardMaterials.map(material => {
        return {
          id: material.id,
          code: material.code,
          qtu: material.qtu,
          product: material.product,
          date: '2000-01-01', // это со склада дата доступности
          time: 0,            //  время доступности
          reserved: 0,
          reservedTo: NaN
        }
      });


    // Массив всех операций, которые должны быть просчитаны (все кроме драфт и отменен)
    let tCardOperations: TCardOperationItem[] = [];
    if (tCard.tCardOperations)
      tCardOperations = tCard.tCardOperations.filter(elem => (elem.status !== StatusEnum.draft && elem.status !== StatusEnum.cancelled))

    // Массив отобранных операций  
    // (они готовы для планирования или уже запланированы или выполнены с учетом последовательности))
    let selectedOperations: TCardOperationItem[] = [];

    // здесь стартуем цикл планирования с сегодняшней даты пока операций для планирования в tCardOperations не останется
    let stoploop = false;

    while (tCardOperations.length > 0 && !stoploop) {
      //+ 1--------    

      ////////////////////////////////////
      // 2 . ищем операции исходники для которых готовы на данной итерации
      // и убираем эти исходники из списка как израсходованные (резервируем на операцию)
      // и получаем список операций ко торые можно делать selectedOperations
      // и добавляем к выбранным операциям те у которых нет исходника - ничего не мешает их делать в первую итерацию
      let message = "";

      tCardOperations.forEach((operation) => {

        let hasAllMatchingProducts = (operation.inn.length > 0)
          ? operation.inn.every(innProduct => {
            // Ищем продукт в tCardReady с таким же code и product
            const matchingReadyProduct = readyProducts.find(elem =>
              elem.code === innProduct.code
              // && elem.product.id === innProduct.product.id
            );
            // Если соответствующий продукт найден, проверяем количество
            if (matchingReadyProduct) {
              // проверяем может продукт уже зарезервирован именно на эту операцию
              const reservedProd = readyProducts.find(
                rProd => operation.idc === rProd.reservedTo
                  && rProd.code === innProduct.code
                  && rProd.reserved >= innProduct.qtu)
              if (reservedProd !== undefined)
                return true;

              // Если количество в tCardReady недостаточно для операции, пропускаем операцию
              if (matchingReadyProduct.qtu < innProduct.qtu) {
                message = message.concat(`Не хватает продукта ${innProduct.product.title} (код: ${innProduct.code}). Недостаточно: ${innProduct.qtu - matchingReadyProduct.qtu} единиц.\n`);
                return false;
              }

              // Если количество незарезервировано в tCardReady больше , уменьшаем его на количество, использованное в операции
              matchingReadyProduct.qtu -= innProduct.qtu;
              // И заводим строку резервирования материала под операцию
              readyProducts.push(
                {
                  id: innProduct.id,
                  product: innProduct.product,
                  code: innProduct.code,
                  qtu: 0,
                  date: matchingReadyProduct.date,
                  time: matchingReadyProduct.time,
                  reserved: innProduct.qtu,
                  reservedTo: operation.idc
                })
              return true;
            }
            message = message.concat(`Не хватает продукта ${innProduct.product.title} (код: ${innProduct.code}). Недостаточно: ${innProduct.qtu} единиц.\n`);

            return false; // Если продукта нет или не совпадает по uom
          })
          : true

        // Если все продукты прошли проверку, добавляем операцию в selectedOperations
        if (hasAllMatchingProducts) {
          selectedOperations.push(operation);
        }
      });

      if (selectedOperations.length === 0)
        return {
          success: false,
          planedCardLoads: planedCardLoads,
          message: `Не все операции готовы к планированию или карта несогласована ${message}`
        };

      // Убираем записи в которых qtu = 0 - они израсходованы на список выбранных операций 
      //  и операции с пустыми резервами
      readyProducts = readyProducts.filter(elem => elem.qtu > 0 || elem.reserved > 0);
      ////////////////////////////////////
      // В итоге останутися только резервированные строки и готовый результат карты
      ////////////////////////////////////

      // 3. ПЛАНИРОВАНИЕ
      // если операция не входит в список для планирования  -  прокручиваем 
      // а иначе перепланируем за исключение пришпиленных

      // Перебираем все операции которые уже готовы к выполнению по наличию исходников для них 
      for (let index = 0; index < selectedOperations.length; index++) {
        const operation = selectedOperations[index];

        // selectedOperations.forEach((operation) => {
        // определяем надо операцию спланировать или нет
        // если операция не входит в список планируемых  находим лоады 
        // и определяем дату готовности конечного продукта
        //  проворачиваем без пертеписывания лоадов
        if (!operationsToPlanIds.includes(Number(operation.id))) {

          // вместо id  делаю по карте и idc
          const operLoads: UnitLoadItem[] = updatedUnitLoads.filter(load => load.idc_oper === operation.idc && load.id_tCard === tCard.id);

          // вытаскиваем последний лоад операции соответствующий статусу самой операции (для позиционирования во времени)
          const { dateFinish, timeFinish } = dateResultLoad(operLoads, operation.status);
          //////////////////////////////////////////////////
          //   операцию распределили  добавляем продукты произведенные операцией со сроком готовности 
          readyProducts = doLoopProductsOper(readyProducts, operation, dateFinish, timeFinish);
          // console.log('readyProducts',readyProducts);
          //  Удаляем операцию из общего массива - обработали
          const index = tCardOperations.findIndex(oper => oper.id === operation.id);
          tCardOperations.splice(index, 1);

        } else {
          // если операция входит в список планируемых - планируем
          // Получаем действие для текущей операции
          const action = operation.action;

          // Находим все юниты, которые могут выполнить это действие 
          const compatibleuUnits = units.filter(unit => {
            if (unit.belong !== UnitBelongEnum.inner) return false
            const actions = unitActions.filter(ac => ac.unitId === unit.id)
            return actions.some(unitAction => unitAction.action.id === action.id);
          });

          // если подходящих юнитов нет  -  значит операцию выполнить мы не можем - уходим с планирования с отказом
          if (compatibleuUnits.length === 0) {
            message = `Нет ни одного юнита который может выполнить действие  ${operation.action.title}`;
            return { success: false, planedCardLoads: planedCardLoads, message: message };
          }

          // Ищем лоады на эту операцию если есть
          const operLoads: UnitLoadItem[] = updatedUnitLoads.filter(load => load.id_oper === operation.id && load.status !== "cancelled");

          // вытаскиваем последний лоад операции соответствующий статусу самой операции (для позиционирования во времени)
          const { dateFinish, timeFinish, } = dateResultLoad(operLoads, operation.status);

          let isPinned = false;

          //  0- если операция пришпилена (лоады isPinned) - оставляем лоады как есть
          if (operLoads.length > 0 && operLoads[0]?.isPinned) {
            readyProducts = doLoopProductsOper(readyProducts, operation, dateFinish, timeFinish);
            //  Удаляем операцию из общего массива - обработали
            const index = tCardOperations.findIndex(oper => oper.id === operation.id);
            tCardOperations.splice(index, 1);
            isPinned = true;
          }

          if (operation.status === StatusEnum.prepared && !isPinned) {

            // очищаю старые лоады по этой операции ( на всяк пож)
            updatedUnitLoads = updatedUnitLoads.filter(lo => lo.id_oper != (operation.id))

            // проверяем наличие  исходников операции на плановую дату на дату 
            const sourcesProducts = readyProducts.filter(elem => elem.reservedTo === operation.idc);

            let { maxDateSource, maxTimeSource } = (sourcesProducts.length > 0)
              ? getMaxDate(sourcesProducts, operation.inn) : { maxDateSource: today_, maxTimeSource: 0 };

            console.log('{ maxDateSource, maxTimeSource }', { maxDateSource, maxTimeSource })

            if (new Date(maxDateSource).getTime() < today.getTime() || operation.inn.length === 0) {
              maxDateSource = today_;
              maxTimeSource = 0
            }
            console.log('{ maxDateSource = today_; maxTimeSource = 0}', { maxDateSource, maxTimeSource })

            // Возвращаем юнит с добавленной операцией,  если юнит не нашелся возвращаем  undefined
            const resultPlaning = findAvailableTimeForOperation(userId, locale, tCard, compatibleuUnits, unitActions, updatedUnitLoads, operation, maxDateSource, maxTimeSource, stopDateStr, shedule_, exceptionItems, isPinned);

            // если не удалось запланировать то прерываем расчет
            if (!resultPlaning.success) {
              message = `Действие - A${operation.idc}: ${resultPlaning.message}`;
              stoploop = true;
            } else {

              const { planedUnitLoads, dateReady, timeReady } = resultPlaning;
              updatedUnitLoads = [...updatedUnitLoads, ...planedUnitLoads];

              const planedOperLoads = planedUnitLoads.filter(lo => lo.id_oper === operation.id)
              planedCardLoads = [...planedCardLoads, ...planedOperLoads];

              //   операцию распределили  добавляем продукты (если есть) произведенные операцией со сроком готовности                    
              if (operation.out) {
                //   операцию распределили  добавляем продукты произведенные операцией со сроком готовности    
                readyProducts = doLoopProductsOper(readyProducts, operation, dateReady, timeReady);
              }
            }
          }
          //  Удаляем операцию из общего массива
          const index = tCardOperations.findIndex(oper => oper.id === operation.id);
          tCardOperations.splice(index, 1);
        }
      };

      // очищаю массив выбранных операций  для новой порции
      selectedOperations = [] as TCardOperationItem[];

      if (stoploop) {
        return { success: false, planedCardLoads: [] as UnitLoadItem[], message: message };
      }
      //- 1--------      
    };
    return { success: true, planedCardLoads: planedCardLoads, message: t('mes.prePlanDone') };
  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-plan/planTCardFromOperINC",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "cancelLoads",
    }).catch(() => { console.error("logger error"); });

    return { success: false, planedCardLoads: [] as UnitLoadItem[], message: 'db_error: ' + msg };
  }
}

// В этом модуле делаем РАСЧЕТ ПЛАНИРОВАНИЯ, одной операции на определенном юните
export const planOperOnUnit = (
  userId: number,
  locale: string,
  operation: TCardOperationItem,
  tCard: TCardItem,
  unit: UnitItem,
  unitActions: UnitActionItem[],
  schedule_: ScheduleItem,
  unitLoads: UnitLoadItem[],
  exceptionItems: UnitExceptionItem[],
  todayStr: string,
  maxDateSource: string, // дата готовности источников - раньше операцию планировать нельзя
  maxTimeSource: number,  // время готовности источников - раньше операцию планировать нельзя
  //  возвращаем лоады по операции
): { success: boolean, operLoads: UnitLoadItem[], message: string } => {

  const t = getServerT(locale, 'sermes');

  try {
    let updatedUnitLoads = [...unitLoads];

    const stopDate_ = getCurrentDateInDate(schedule_.timeZone)

    stopDate_.setDate(stopDate_.getDate() + 90);
    const stopDateStr = YYYYMMDD(stopDate_);

    let message = "";

    if (operation.status !== StatusEnum.prepared) {

      // message = `Операцию - A${operation.idc} можно планировать только в prepared статусе `;
      message = `${t('mes.onlyPreparedOperPossiblePlan')} action: A${operation.idc} (${operation.action.title})`
      return { success: false, operLoads: updatedUnitLoads, message: message };
    }

    // очищаю старые лоады по этой операции
    updatedUnitLoads = updatedUnitLoads.filter(lo => lo.id_oper != (operation.id))


    if (maxDateSource < todayStr) {
      maxDateSource = todayStr;
      maxTimeSource = 0
    }

    // Возвращаем юнит с добавленной операцией,  если юнит не нашелся возвращаем  undefined
    const resultPlaning = findAvailableTimeForOperation(userId, locale, tCard, [unit], unitActions, updatedUnitLoads, operation, maxDateSource, maxTimeSource, stopDateStr, schedule_, exceptionItems, true);

    // если не удалось запланировать то прерываем расчет
    if (!resultPlaning.success) {
      // message = `Действие - A${operation.idc}: ${resultPlaning.message}`;
      message = `${t('mes.action')} - A${operation.idc}: ${resultPlaning.message}`;
      return { success: false, operLoads: [], message: message };
    }
    const operLoads = resultPlaning.planedUnitLoads.filter(lo => lo.id_oper === operation.id)

    return { success: true, operLoads: operLoads, message: "" };

  } catch (e: unknown) {
    const msg = e instanceof Error ? `${t('mes.error')} ${e.message}` : t('mes.error');

    void ulogger.error({
      userId,
      location: "handlers/handlers-plan/planTCardFromOperINC",
      event: "db_error",
      message: `catch: ${msg}`,
      context: "cancelLoads",
    }).catch(() => { console.error("logger error"); });

    return { success: false, operLoads: [] as UnitLoadItem[], message: 'db_error: ' + msg };
  }
}

// вытаскиваем последний лоад операции соответствующий статусу самой операции (для позиционирования операции во времени)
function dateResultLoad(
  operLoads: UnitLoadItem[],
  status: StatusEnum
): { dateStart: string; timeStart: number; dateFinish: string; timeFinish: number; loadId: number } {
  // Фильтруем загрузки по переданному статусу
  const filteredLoads = operLoads.filter(load => load.status === status);

  if (filteredLoads.length === 0) {
    return { dateStart: "", timeStart: 0, dateFinish: "", timeFinish: 0, loadId: NaN };
  }

  // Функция для создания объекта Date из строки даты и минут (время в минутах от начала суток)
  const createDateTime = (dateStr: string, minutes: number): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return new Date(year, month - 1, day, hours, mins, 0, 0);
  };

  // Инициализируем переменные из первой загрузки
  let minStartDate = createDateTime(filteredLoads[0].date, filteredLoads[0].timeStart);
  let maxFinishDate = createDateTime(filteredLoads[0].date, filteredLoads[0].timeFinish);
  let maxLoad = filteredLoads[0];

  // Перебираем отфильтрованные загрузки
  for (const load of filteredLoads) {
    const currentStart = createDateTime(load.date, load.timeStart);
    const currentFinish = createDateTime(load.date, load.timeFinish);

    if (currentStart < minStartDate) {
      minStartDate = currentStart;
    }
    if (currentFinish > maxFinishDate) {
      maxFinishDate = currentFinish;
      maxLoad = load;
    }
  }

  // Функция форматирования Date в строку "YYYY-MM-DD"
  const formatDate = (date: Date): string => {
    const yr = date.getFullYear();
    const mon = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${yr}-${mon}-${day}`;
  };

  // Функция для вычисления минут от начала суток
  const getMinutesFromDate = (date: Date): number => date.getHours() * 60 + date.getMinutes();

  return {
    dateStart: formatDate(minStartDate),
    timeStart: getMinutesFromDate(minStartDate),
    dateFinish: formatDate(maxFinishDate),
    timeFinish: getMinutesFromDate(maxFinishDate),
    loadId: maxLoad.id || 0,
  };
}

// получает дату когда изготовлены  все продукты из списка
function getMaxDate(
  sourcesProducts: ReadyProduct[],
  inn: TCardProductItem[]
): { maxDateSource: string; maxTimeSource: number } {
  // Преобразуем дату в строку формата "YYYY-MM-DD"
  const formatDate = (date: Date): string => {
    const yr = date.getFullYear();
    const mon = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${yr}-${mon}-${day}`;
  };

  // Фильтруем только те продукты, которые присутствуют в массиве inn (по полю code)
  const filteredSources = sourcesProducts.filter((item) =>
    inn.some((prod) => prod.code === item.code)
  );

  if (filteredSources.length > 0) {
    // Находим продукт с максимально поздним моментом (дата + time в минутах)
    const maxProduct = filteredSources.reduce((max, item) => {
      const itemTimestamp =
        new Date(item.date).getTime() + item.time * 60000;
      const maxTimestamp =
        new Date(max.date).getTime() + max.time * 60000;
      return itemTimestamp > maxTimestamp ? item : max;
    });

    const maxDateString = formatDate(new Date(maxProduct.date));
    const maxTime = maxProduct.time;
    return { maxDateSource: maxDateString, maxTimeSource: maxTime };
  } else {
    return { maxDateSource: "", maxTimeSource: 0 };
  }

}

export const getPreviousOpers = (
  oper: TCardOperationItem,
  tCard: TCardItem
): number[] | undefined => {
  const prevOpers: number[] = [];

  // Формируем массив исходных продуктов из текущей операции  
  const innProducts: TCardProductItem[] = oper.inn.map(material => ({
    id: material.id,
    product: material.product,
    code: material.code,
    qtu: material.qtu,
  }));

  // Формируем массив исходных материалов карты 
  let sources: Array<{
    id?: number;
    product: ProductItem;
    code: string;
    qtu: number;
    oper_idc: number;
  }> = tCard.tCardMaterials
      ? tCard.tCardMaterials.map(material => ({
        id: material.id,
        product: material.product,
        // idc: material.idc,
        code: material.code,
        // title: material.title,
        qtu: material.qtu,
        // uom: material.uom,
        oper_idc: NaN  // По умолчанию, материалы не имеют источника операции
      }))
      : [];

  // Добавляем в массив источников результаты предыдущих операций
  tCard.tCardOperations?.forEach(op => {
    if (op.id !== oper.id) {
      // Для каждой предыдущей операции берем её выходные продукты,
      // устанавливая oper_idc равным op.idc (идентификатор предыдущей операции)
      const out = op.out.map(o => ({ ...o, oper_idc: op.idc }));
      sources = [...sources, ...out];
    }
  });

  // Обрабатываем массив входящих продуктов (innProducts)
  while (innProducts.length > 0) {
    let innProduct = innProducts[0];
    // Ищем источник, у которого code и продукт совпадают, и у которого ещё есть доступное количество (qtu > 0)
    const sourceIndex = sources.findIndex(source =>
      source.code === innProduct.code &&
      source.product.id === innProduct.product.id &&
      source.qtu > 0 &&
      innProduct.qtu > 0
    );

    if (sourceIndex === -1) {
      // Если нет подходящего источника, операция выполнить невозможно
      return undefined;
    }
    const sourceItem = sources[sourceIndex];
    // Берем минимальное количество, которое можно использовать
    const qtu = Math.min(sourceItem.qtu, innProduct.qtu);
    // Обновляем количество в источнике
    sources[sourceIndex] = { ...sourceItem, qtu: sourceItem.qtu - qtu };
    // Обновляем количество в innProduct
    innProduct = { ...innProduct, qtu: innProduct.qtu - qtu };
    // Запоминаем идентификатор предыдущей операции (если он есть) из источника
    //  если нет  то тогда это предмет со склада
    if (sourceItem.oper_idc) prevOpers.push(sourceItem.oper_idc);

    // Если innProduct полностью исчерпан, удаляем его из массива
    if (innProduct.qtu === 0) {
      innProducts.splice(0, 1);
    } else {
      innProducts[0] = innProduct;
    }
  }
  return prevOpers;
};

// Функция получает на выходе самую позднюю дату исполнения всех операций которые подаются на вход
// opers - idc -операций для поиска лоадов,
// loads - все лоады по этой карте
//  если найдены лоады по всем операциям в статусе ready, performed, planed
//  возвращаем дату последнего когда все должно быть готово либо если это в прошлом - сегодняшнюю дату
//  а иначе undefined  
export const getFinishOperations = (
  opers: number[],
  loads: UnitLoadItem[],
  today: string // в формате "YYYY-MM-DD"
): { date: string; time: number } | undefined => {

  // если нет предыдущих операций
  if (opers.length === 0) return { date: today, time: 0 };

  // Допустимые статусы
  const validStatuses = [StatusEnum.ready, StatusEnum.performed, StatusEnum.planed, StatusEnum.prepared, StatusEnum.defective];

  // Проверяем, что для каждого идентификатора операции в opers есть хотя бы один load с нужным статусом
  for (const opId of opers) {
    const matchingLoads = loads.filter(
      load => load.idc_oper === opId && validStatuses.includes(load.status) && !load.isRetool
    );
    if (matchingLoads.length === 0) {
      return undefined;
    }
  }

  // Фильтруем загрузки, соответствующие заданным операциям и допустимым статусам
  const filteredLoads = loads.filter(
    load => opers.includes(load.idc_oper) && validStatuses.includes(load.status)
  );

  // Находим максимальный момент завершения
  // Предполагаем, что load.date имеет формат "YYYY-MM-DD" и load.timeFinish – минуты от начала дня

  const finishLoad = filteredLoads.reduce((latest, load) => {
    if (load.date > latest.date) {
      return load;
    } else if (load.date === latest.date && load.timeFinish > latest.timeFinish) {
      return load;
    } else {
      return latest;
    }
  });
  if (finishLoad.date > today || finishLoad.date === today && finishLoad.timeFinish > 0)
    return { date: finishLoad.date, time: finishLoad.timeFinish };
  else return { date: today, time: 0 };

};

// Выбирает наиболее позднюю из двух дат формата 
// { date: "yyyy-mm-dd"; time: количество минут от начала дня }
export function getLaterDateTime(
  dt1: { date: string; time: number },
  dt2: { date: string; time: number }
): { date: string; time: number } {
  // Так как формат "YYYY-MM-DD" корректно сравнивается как строка,
  // сначала сравниваем даты
  if (dt1.date > dt2.date) {
    return dt1;
  } else if (dt1.date < dt2.date) {
    return dt2;
  } else {
    // Если даты равны, сравниваем время (в минутах)
    return dt1.time >= dt2.time ? dt1 : dt2;
  }
}

export function getOperationReadyMoment(
  oper: TCardOperationItem,
  tCard: TCardItem,
  loads: UnitLoadItem[],
  planDate: string,   // плановая дата для текущей операции ("YYYY-MM-DD")
  planTime: number,   // плановое время начала (в минутах от начала дня)
  today: string       // сегодняшняя дата ("YYYY-MM-DD")
): { date: string; time: number } | undefined {
  // 1. Получаем массив idc предыдущих операций (источников) для текущей операции
  const previousOpersIdcs = getPreviousOpers(oper, tCard);
  if (!previousOpersIdcs) {
    // Если не найдены источники, возвращаем undefined (или можно кинуть ошибку)
    return undefined;
  }

  // 2. Получаем момент готовности из уже запланированных загрузок для всех предыдущих операций
  const timeStartRes = getFinishOperations(previousOpersIdcs, loads, today);
  if (!timeStartRes) {
    return undefined;
  }

  // 3. Выбираем наиболее поздний момент между рассчитанным моментом и плановой датой/временем текущей операции
  const readyMoment = getLaterDateTime(timeStartRes, { date: planDate, time: planTime });
  return readyMoment;
}

// из массива лоадов на вход выдает наиболее ранюю дату
export function getEarliestStart(loads: UnitLoadItem[]): { date: string; timeStart: number } | undefined {
  if (loads.length === 0) return undefined;
  const earliest = loads.reduce((min, load) => {
    // Сначала сравниваем даты, поскольку формат "YYYY-MM-DD" корректно сравнивается лексикографически
    if (load.date < min.date) {
      return load;
    } else if (load.date === min.date && load.timeStart < min.timeStart) {
      return load;
    } else {
      return min;
    }
  }, loads[0]);

  return { date: earliest.date, timeStart: earliest.timeStart };
}