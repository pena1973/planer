import { ulogger } from "./../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import {
  TCardProductItem, TCardOperationItem, ProductItem,
  TCardItem, UnitLoadItem, UnitExceptionItem,
  CalendarItem, TimeTypeEnum, StatusEnum,
  UnitItem, ScheduleItem, UnitBelongEnum,
  UnitActionItem, ReadyProduct
} from "./../types/types";

import { YYYYMMDD, isHoliday, idDay, isWeekend, isAdditionalTime } from "@/lib/common/utils"
import { getCurrentDateInDate, getTimeZoneDateFromDateString, addDaysInZone, YYYYMMDDTZ } from "./../lib/common/timezone"

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

// генерация одного дня на шкале
const generateCalendarItemOnServer = (day: string, schedule: ScheduleItem): CalendarItem => {

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


// ! Получить ID всех зависимых операций со статусом planed (одно "плечо", без рекурсии)
// FIX: тут раньше ошибочно стоял фильтр prepared
export const getDependentPlanedOperationsIds = (
  tCard: TCardItem,
  oper: TCardOperationItem
): number[] => {
  const ops = tCard.tCardOperations ?? [];
  if (ops.length === 0) return [];

  const outCodes = new Set((oper.out ?? []).map(p => `${p?.code ?? ""}`).filter(Boolean));

  const dependentOps = ops.filter(op =>
    op.id !== oper.id &&
    (op.inn ?? []).some(inp => outCodes.has(`${inp?.code ?? ""}`))
  );

  const planedOps = dependentOps.filter(op => op.status === StatusEnum.planed);
  return planedOps.map(op => op.id!).filter((id): id is number => id != null);
};


// ! Все зависимые операции по цепочке (все статусы) — возвращаем объекты операций
export const getDependentOperations = (
  tCard: TCardItem,
  oper: TCardOperationItem
): TCardOperationItem[] => {
  const ops = tCard.tCardOperations ?? [];
  if (ops.length === 0) return [];

  // FIX: нормализуем коды к строке и отбрасываем пустые
  const norm = (code: unknown) => `${code ?? ""}`.trim();
  const notEmpty = (s: string) => s.length > 0;

  // Индекс: входной code -> список операций (кроме исходной)
  // FIX: используем Map<string, TCardOperationItem[]>; защита от дублей на уровне seenOpIds
  const index = new Map<string, TCardOperationItem[]>();
  for (const op of ops) {
    if (op.id === oper.id) continue;
    const inn = op.inn ?? [];
    for (const inp of inn) {
      const key = norm(inp?.code);
      if (!notEmpty(key)) continue;
      const bucket = index.get(key);
      if (bucket) bucket.push(op);
      else index.set(key, [op]);
    }
  }

  // Стартовые коды — все выходные коды исходной операции
  const startCodes = (oper.out ?? [])
    .map(p => norm(p?.code))
    .filter(notEmpty);

  if (startCodes.length === 0) return [];

  // BFS по кодам продуктов:
  //  - queue по кодам,
  //  - seenCodes чтобы не ходить по кругу при циклах по коду,
  //  - seenOpIds чтобы не добавлять одну и ту же операцию много раз.
  const queue: string[] = Array.from(new Set(startCodes));
  const seenCodes = new Set(queue);
  const seenOpIds = new Set<number>();
  const result: TCardOperationItem[] = [];

  while (queue.length) {
    const code = queue.shift()!;

    const dependents = index.get(code) ?? [];
    for (const dep of dependents) {
      const id = dep.id;
      if (id == null || seenOpIds.has(id)) continue; // уже добавляли

      // Добавляем операцию как следующую в цепочке
      seenOpIds.add(id);
      result.push(dep);

      // FIX: расширяем фронт поиска по всем её out-кодам
      const outs = dep.out ?? [];
      for (const out of outs) {
        const nextCode = norm(out?.code);
        if (!notEmpty(nextCode)) continue;
        if (!seenCodes.has(nextCode)) {
          seenCodes.add(nextCode);
          queue.push(nextCode);
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
  compatibleuUnits: UnitItem[],
  unitActions: UnitActionItem[],
  unitLoadItems: UnitLoadItem[],
  operation: TCardOperationItem,
  startDateStr: string,   // "YYYY-MM-DD"
  moment: number,         // минутный «момент» старта внутри дня, когда готовы материалы
  stopDateStr: string,    // "YYYY-MM-DD"
  schedule: ScheduleItem,
  exceptionItems: UnitExceptionItem[],
  isPinned: boolean,
): { success: boolean, planedUnitLoads: UnitLoadItem[], dateReady: string, timeReady: number, message: string } {

  const t = getServerT(locale, 'sermes');
  const version = generateUniqueIdc();

  const targetDate = getTimeZoneDateFromDateString(startDateStr, schedule.timeZone);
  const stopDate = getTimeZoneDateFromDateString(stopDateStr, schedule.timeZone);

  if (targetDate.getTime() > stopDate.getTime()) {
    // console.warn('[FIND] abort: targetDate > stopDate', { targetDate, stopDate });
    return {
      success: false,
      planedUnitLoads: unitLoadItems,
      dateReady: "",
      timeReady: 0,
      // message: `Планирование не удалось: нет свободных ресурсов до ${stopDateStr}`
      message: `${t('mes.noOperToplan')} ${stopDateStr}`
    };
  }

  const operationDuration = Math.ceil(operation.duration / (1000 * 60));
  const interruptible = !!(operation.action.interruptible);

  interface Candidate {
    unit: UnitItem;
    opSegments: { date: string, start: number; finish: number, isRetool: boolean }[];
    duration: number;
  }

  const possibleCandidates: Candidate[] = [];

  for (const unit of compatibleuUnits) {
    const actions = unitActions.filter(ac => ac.unitId === unit.id);
    const retoolTime = unit.retool;
    const action = actions.find(a => a.action.id === operation.action.id);
    const koef = action ? action.koef : 1;
    const opRequired = operationDuration * koef;
    const onPlaned = 0;
    const totalRequired = retoolTime + opRequired;
    const opSegments: { date: string, start: number; finish: number, isRetool: boolean }[] = [];
    const isRetoolSegmentDefined = (retoolTime === 0);
   

    // КРИТИЧЕСКОЕ место: сюда передаём moment, именно тут он должен учитываться
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
      isRetoolSegmentDefined
    );
    

    if (resultOpSegments.success) {
      possibleCandidates.push({
        unit,
        opSegments: resultOpSegments.opSegments,
        duration: totalRequired,
      });
    }
  }

  // console.log('[FIND] possibleCandidates count', possibleCandidates.length);

  if (possibleCandidates.length > 0) {
    // FIX: сортируем по финишу в той же таймзоне, что и расчёты
    const finishTs = (seg: { date: string, finish: number }) =>
      getTimeZoneDateFromDateString(seg.date, schedule.timeZone).getTime() + seg.finish * 60000; // finish — минуты

    possibleCandidates.sort((a, b) => {
      const aLast = a.opSegments.at(-1) ?? null;
      const bLast = b.opSegments.at(-1) ?? null;
      if (!aLast && !bLast) return 0;
      if (!aLast) return -1;
      if (!bLast) return 1;
      return finishTs(aLast) - finishTs(bLast);
    });
    
    const bestCandidate = possibleCandidates[0];

    const updatedUnitLoads: UnitLoadItem[] = [];
    let isFirst = true;

    bestCandidate.opSegments.forEach(seg => {
      const actions_ = unitActions.filter(ac => ac.unitId === bestCandidate.unit.id);

      const action_ = actions_.find(act => act.action?.id === operation.action.id); // FIX
      const koef_ = (action_) ? action_.koef : 1;

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
        loadInfo: {
          tCardIdc: tCard.idc,
          tCardDate: tCard.date,
          title: operation.action.title,
          duration: Math.round(operation.duration / 60000),
          interruptible: operation.action.interruptible,
          koef: koef_
        },
        isPinned: isPinned,
        isOuterStart: false,
        isOuterFinish: false,
        version: version,
        isFirst: seg.isRetool ? false : isFirst
      });

      isFirst = seg.isRetool ? isFirst : false;
    });
    

    if (updatedUnitLoads.length === 0) {
      // console.warn('[FIND] no updatedUnitLoads created');
      return {
        success: false,
        planedUnitLoads: updatedUnitLoads,
        dateReady: "",
        timeReady: 0,
        // message: "Не удалось построить загрузки по выбранному юниту."
        message: `${t('mes.noPossibleLoadsForUniit')}`

      };
    }

    const finalLoad = updatedUnitLoads[updatedUnitLoads.length - 1];
    // FIX: корректное success-сообщение
    return {
      success: true,
      planedUnitLoads: updatedUnitLoads,
      dateReady: finalLoad.date,
      timeReady: finalLoad.timeFinish,
      message: `${t('mes.successfulPlaning')}`
    };
  }

  // console.warn('[FIND] no candidates found until stopDate', { stopDateStr, timeZone: schedule?.timeZone });
  return {
    success: false,
    planedUnitLoads: unitLoadItems,
    dateReady: "",
    timeReady: 0,
    message: `Не найдено свободных слотов до ${stopDateStr} с учётом момента старта, непрерывности и коэффициентов.`
  };
}

// Рекурсия для разбивки операции на промежутки...
function findAvailableSegmentsDay(
  userId: number,
  locale: string,
  targetDateStr: string,  // YYYY-MM-DD в TZ schedule.timeZone
  moment: number,         // (минуты) earliest start ТОЛЬКО для targetDateStr; на след.дни = 0
  stopDateStr: string,
  opSegments_: { date: string, start: number, finish: number, isRetool: boolean }[],
  unit: UnitItem,
  retoolTime: number,
  opRequired: number,
  onPlaned_: number,
  unitLoadItems: UnitLoadItem[],
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

  console.log("[SPLIT] start", { targetDateStr, moment, stopDateStr, tz: schedule.timeZone, unitId: unit.id });

  // Быстрая проверка: строки в формате YYYY-MM-DD сравнимы лексикографически
  if (targetDateStr > stopDateStr) {
    console.warn("[SPLIT] stop reached", { targetDateStr, stopDateStr });
    return { success: false, opSegments: [], message: `достигнута стоп дата и нет свободных ресурсов до ${stopDateStr}` };
  }

  const targetDate = getTimeZoneDateFromDateString(targetDateStr, schedule.timeZone);

  const workDay = generateCalendarItemOnServer(targetDateStr, schedule);
  let workStart = workDay.timeStartWork;
  let workEnd = workDay.timeFinishWork;

  const busyPeriods: { type: TimeTypeEnum; start: number; end: number }[] = [];

  const exceptionsWorkDay = exceptionItems.filter(ex => ex.unitId === unit.id && ex.date === targetDateStr);
  if (exceptionsWorkDay.length > 0) {
    exceptionsWorkDay.forEach(ex => {
      if (ex.type === TimeTypeEnum.work) {
        workStart = ex.timeStart;
        workEnd = ex.timeFinish;
      } else {
        busyPeriods.push({ type: ex.type, start: ex.timeStart, end: ex.timeFinish });
      }
    });
  }

  let onPlaned = onPlaned_;
  let opSegments = [...opSegments_];
  let isRetoolSegmentDefined = (retoolTime === 0) || isRetoolSegmentDefined_;

  // Нерабочий день → сразу к следующему (moment на следующие дни = 0)
  if (workEnd === workStart) {
    const nextDate = addDaysInZone(targetDate, 1, schedule.timeZone);
    const nextDateStr = YYYYMMDDTZ(nextDate, schedule.timeZone); // FIX: TZ-безопасно
    return findAvailableSegmentsDay(
      userId, locale, nextDateStr, 0, stopDateStr, opSegments, unit,
      retoolTime, opRequired, onPlaned, unitLoadItems, schedule,
      exceptionItems, interruptible, totalRequired, isRetoolSegmentDefined
    );
  }

  // Уже запланированные загрузки на ЭТУ дату
  const loads = unitLoadItems.filter(load => load.unit.id === unit.id && load.date === targetDateStr);
  loads.forEach(load => busyPeriods.push({ type: TimeTypeEnum.busy, start: load.timeStart, end: load.timeFinish }));

  // Перерывы из календаря, если нет work-исключения
  if (exceptionsWorkDay.length === 0) {
    workDay.breaks.forEach(b => busyPeriods.push({ type: TimeTypeEnum.breack, start: b.timeStart, end: b.timeFinish }));
  }

  busyPeriods.sort((a, b) => a.start - b.start);

  // // рабочие границы дня с учётом исключений; hasWork=true, если есть рабочее время
  // const getWorkBounds = (dateStr: string) => {
  //   const wd = generateCalendarItemOnServer(dateStr, schedule);
  //   let ws = wd.timeStartWork;
  //   let we = wd.timeFinishWork;

  //   const ex = exceptionItems.filter(e => e.unitId === unit.id && e.date === dateStr);
  //   if (ex.length > 0) {
  //     ex.forEach(e => {
  //       if (e.type === TimeTypeEnum.work) {
  //         ws = e.timeStart;
  //         we = e.timeFinish;
  //       }
  //     });
  //   }
  //   return { start: ws, end: we, hasWork: we > ws };
  // };

  // FIX: и ретул, и основная операция в первый день — не раньше moment
  // (на последующих днях moment=0, поэтому ограничение не мешает)
  let availableStart = Math.max(workStart, moment);

  // console.log("[SPLIT] day window", { targetDateStr, workStart, workEnd, moment, availableStart, busyCount: busyPeriods.length });

  // Если попали внутрь занятости — прыгаем на её конец
  const hit = busyPeriods.find(p => p.start <= availableStart && p.end > availableStart);
  if (hit) availableStart = Math.max(availableStart, hit.end);

  // ───────────────────────────────
  // Хелперы 
  // ───────────────────────────────

  const nextNonBreakAfter = (pos: number) =>
    busyPeriods.find(p => p.start >= pos && p.type !== TimeTypeEnum.breack) ?? null;

  const firstBusyAtNextWorkdayStart = (): { dateStr: string, end: number } | null => {
    let d = addDaysInZone(getTimeZoneDateFromDateString(targetDateStr, schedule.timeZone), 1, schedule.timeZone);
    let ds = YYYYMMDDTZ(d, schedule.timeZone);

    while (true) {
      const wd = generateCalendarItemOnServer(ds, schedule);
      if (wd.timeFinishWork > wd.timeStartWork) {
        const loadsNext = unitLoadItems
          .filter(l => l.unit.id === unit.id && l.date === ds)
          .sort((a, b) => a.timeStart - b.timeStart);
        const firstBusy = loadsNext.find(l => l.timeFinish > wd.timeStartWork);
        if (firstBusy && firstBusy.timeStart <= wd.timeStartWork) {
          return { dateStr: ds, end: firstBusy.timeFinish };
        }
        return null;
      }
      d = addDaysInZone(d, 1, schedule.timeZone);
      ds = YYYYMMDDTZ(d, schedule.timeZone);
      if (ds > stopDateStr) return null;
    }
  };

  // ───────────────────────────────
  // НЕПРЕРЫВАЕМАЯ ОПЕРАЦИЯ
  // ───────────────────────────────
  if (!interruptible) {
    let found = false;

    while (availableStart < workEnd && !found) {
      const nextPeriod = busyPeriods.find(p => p.start >= availableStart);
      const freeEnd = nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd;
      let freeInterval = freeEnd - availableStart;

      // 1) Ретул (если ещё не поставили)
      if (freeInterval >= retoolTime && !isRetoolSegmentDefined) {
        // FIX: retool тоже не раньше moment на первом дне
        const retoolStart = Math.max(availableStart, moment); // moment=0 на последующих днях
        const canPlaceRetool = (nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd) - retoolStart >= retoolTime;
        if (canPlaceRetool) {
          opSegments.push({ date: targetDateStr, start: retoolStart, finish: retoolStart + retoolTime, isRetool: true });
          availableStart = retoolStart + retoolTime;
          freeInterval = (nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd) - availableStart;
          isRetoolSegmentDefined = true;
        }
      }

      // 2) Основная операция целиком
      if (isRetoolSegmentDefined) {
        // FIX: основная операция — тоже не раньше moment на первом дне
        const opStartCandidate = Math.max(availableStart, moment);
        const freeIntervalForOp = (nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd) - opStartCandidate;

        if (freeIntervalForOp >= opRequired) {
          opSegments.push({ date: targetDateStr, start: opStartCandidate, finish: opStartCandidate + opRequired, isRetool: false });
          availableStart = opStartCandidate + opRequired;
          found = true;
        } else {
          // не влезает, а дальше именно ЧУЖАЯ → полный сброс операции и рестарт за её концом
          const nb = nextNonBreakAfter(availableStart);
          if (nb?.type === TimeTypeEnum.busy) {
            return findAvailableSegmentsDay(
              userId, locale, targetDateStr, nb.end, stopDateStr,
              [], unit, retoolTime, opRequired, 0,
              unitLoadItems, schedule, exceptionItems, interruptible, totalRequired, false
            );
          }
        }

      }

      if (nextPeriod) {
        availableStart = Math.max(availableStart, nextPeriod.end);
      } else break;
    }

    // последняя попытка в хвосте дня
    if (!found) {
      let freeInterval = workEnd - availableStart;

      if (freeInterval >= retoolTime && !isRetoolSegmentDefined) {
        // FIX: retool тоже не раньше moment
        const retoolStart = Math.max(availableStart, moment);
        const canPlaceRetool = workEnd - retoolStart >= retoolTime;
        if (canPlaceRetool) {
          opSegments.push({ date: targetDateStr, start: retoolStart, finish: retoolStart + retoolTime, isRetool: true });
          availableStart = retoolStart + retoolTime;
          freeInterval = workEnd - availableStart;
          isRetoolSegmentDefined = true;
        }
      }

      if (isRetoolSegmentDefined) {
        // FIX: основная операция — не раньше moment
        const opStartCandidate = Math.max(availableStart, moment);
        const freeIntervalForOp = workEnd - opStartCandidate;
        if (freeIntervalForOp >= opRequired) {
          opSegments.push({ date: targetDateStr, start: opStartCandidate, finish: opStartCandidate + opRequired, isRetool: false });
          availableStart = opStartCandidate + opRequired;
          found = true;
        }
      }
    }

    // Если не нашли — следующий день (moment = 0)
    if (!found) {
      const nextDate = addDaysInZone(targetDate, 1, schedule.timeZone);
      const nextDateStr = YYYYMMDDTZ(nextDate, schedule.timeZone); // FIX: TZ-безопасно
      return findAvailableSegmentsDay(
        userId, locale, nextDateStr, 0, stopDateStr, opSegments, unit,
        retoolTime, opRequired, onPlaned, unitLoadItems, schedule,
        exceptionItems, interruptible, totalRequired, isRetoolSegmentDefined
      );
    }

    // Подправка ретула на перерыв:
    // FIX: на первом дне тоже не раньше moment
    if (opSegments.length >= 2) {
      const retoolSeg = opSegments[0];
      const opSeg = opSegments[1];
      const opStart = opSeg.start;

      let breakStart: number | undefined;
      busyPeriods.forEach(period => {
        if (period.type === TimeTypeEnum.breack && period.start >= retoolSeg.start && period.start < opStart) {
          if (breakStart === undefined || period.start < breakStart) breakStart = period.start;
        }
      });

      const desiredRetoolFinish = breakStart ?? opStart;

      if (retoolSeg.date === targetDateStr) {
        const newRetoolStart = Math.max(workStart, moment, desiredRetoolFinish - retoolTime); // FIX: ≥ moment
        retoolSeg.start = newRetoolStart;
        retoolSeg.finish = desiredRetoolFinish;
      } else {
        const workDayRetool = generateCalendarItemOnServer(retoolSeg.date, schedule);
        const workEndRetool = workDayRetool.timeFinishWork;
        const newRetoolStart = workEndRetool - retoolTime;
        retoolSeg.start = newRetoolStart;
        retoolSeg.finish = workEndRetool;
      }
    }

    return { success: true, opSegments, message: "" };
  }

  // ───────────────────────────────
  // ПРЕРЫВАЕМАЯ ОПЕРАЦИЯ
  // ───────────────────────────────

  while (availableStart < workEnd && onPlaned < opRequired) {
    const nextPeriod = busyPeriods.find(p => p.start >= availableStart);
    const freeEnd = nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd;
    let freeInterval = freeEnd - availableStart;

    // 1) Ретул (не прерываем) — FIX: тоже не раньше moment на первом дне
    if (freeInterval > 0 && !isRetoolSegmentDefined) {
      const retoolStart = Math.max(availableStart, moment);
      const timeToUse = Math.min((nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd) - retoolStart, retoolTime);
      if (timeToUse > 0) {
        opSegments.push({ date: targetDateStr, start: retoolStart, finish: retoolStart + timeToUse, isRetool: true });
        availableStart = retoolStart + timeToUse;
        freeInterval = (nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd) - availableStart;
        isRetoolSegmentDefined = (timeToUse === retoolTime) || isRetoolSegmentDefined_;

        const nb = nextNonBreakAfter(availableStart);
        const blockBreakThenBusy = (freeInterval === 0 && nb?.type === TimeTypeEnum.busy);
        const blockNextDayBusy = (freeInterval === 0 && availableStart >= workEnd) ? firstBusyAtNextWorkdayStart() : null;

        if (blockBreakThenBusy) {
          // ⛔️ Сбрасываем ВСЮ операцию и перезапускаем С ЭТОГО ЖЕ ДНЯ за концом блокирующей busy
          return findAvailableSegmentsDay(
            userId, locale, targetDateStr, nb.end, stopDateStr,
            [],               // все сегменты заново
            unit, retoolTime, opRequired,
            0,                // onPlaned = 0 — сброс целиком
            unitLoadItems, schedule, exceptionItems, interruptible, totalRequired,
            false             // ретул ещё не сделан
          );
        }


        if (blockNextDayBusy) {
          // ⛔️ Сбрасываем ВСЮ операцию и перезапускаем НА СЛЕД. ДЕНЬ после первой busy
          return findAvailableSegmentsDay(
            userId, locale, blockNextDayBusy.dateStr, blockNextDayBusy.end, stopDateStr,
            [], unit, retoolTime, opRequired, 0,
            unitLoadItems, schedule, exceptionItems, interruptible, totalRequired, false
          );
        }

      }
    }

    // 2) Основная работа (можно дробить перерывами/сменой дня, НО не чужими операциями)
    if (freeInterval > 0 && isRetoolSegmentDefined) {
      // FIX: момент применяем только к основной операции на первом дне
      const opStartChunk = Math.max(availableStart, moment);
      let chunkAllowed = (nextPeriod ? Math.min(nextPeriod.start, workEnd) : workEnd) - opStartChunk;
      if (chunkAllowed > 0) {
        const timeToUse = Math.min(chunkAllowed, opRequired - onPlaned);
        opSegments.push({ date: targetDateStr, start: opStartChunk, finish: opStartChunk + timeToUse, isRetool: false });
        onPlaned += timeToUse;
        availableStart = opStartChunk + timeToUse;

        // пересчёт нулевой ёмкости от текущей позиции
        const nextP2 = busyPeriods.find(p => p.start >= availableStart);
        const freeEnd2 = nextP2 ? Math.min(nextP2.start, workEnd) : workEnd;
        let  freeInterval2 = freeEnd2 - availableStart;

        // первый НЕ-перерыв после текущей позиции
        const nb2 = nextNonBreakAfter(availableStart);
       
        // 🔧 FIX: если мы упёрлись ровно в перерыв (обед) и до него места нет,
        // попробуем посмотреть ёмкость ПОСЛЕ перерыва и ДО следующего busy.
        if (freeInterval2 === 0 && nextP2 && nextP2.type === TimeTypeEnum.breack) {
          const afterBreakStart = nextP2.end; // конец обеда
          const afterBreakEnd = nb2 ? Math.min(nb2.start, workEnd) : workEnd;
          const freeAfterBreak = Math.max(0, afterBreakEnd - afterBreakStart);
          freeInterval2 = freeAfterBreak;
        }


        // break -> busy вплотную: свободной ёмкости нет, а ближайший НЕ-перерыв — busy
        const blockBreakThenBusy2 = (onPlaned < opRequired) && (freeInterval2 === 0) && (nb2?.type === TimeTypeEnum.busy);

        // конец дня, а следующий рабочий день сразу начинается с busy
        const blockNextDayBusy2 =
          (onPlaned < opRequired && (freeInterval2 === 0) && availableStart >= workEnd)
            ? firstBusyAtNextWorkdayStart()
            : null;

        if (blockBreakThenBusy2) {
          // полный сброс операции и рестарт в этот же день сразу ПОСЛЕ блокирующей busy
          return findAvailableSegmentsDay(
            userId, locale, targetDateStr, nb2!.end, stopDateStr,
            [], unit, retoolTime, opRequired, 0,
            unitLoadItems, schedule, exceptionItems, interruptible, totalRequired, false
          );
        }

        if (blockNextDayBusy2) {
          // полный сброс операции и рестарт на следующий рабочий день после busy
          return findAvailableSegmentsDay(
            userId, locale, blockNextDayBusy2.dateStr, blockNextDayBusy2.end, stopDateStr,
            [], unit, retoolTime, opRequired, 0,
            unitLoadItems, schedule, exceptionItems, interruptible, totalRequired, false
          );
        }

      }
    }

    if (nextPeriod) availableStart = Math.max(availableStart, nextPeriod.end);
    else break;
  }

  // Хвост дня, если что-то осталось
  if (onPlaned < opRequired) {
    let freeInterval = workEnd - availableStart;

    if (freeInterval > 0 && !isRetoolSegmentDefined) {
      // FIX: ретул тоже не раньше moment
      const retoolStart = Math.max(availableStart, moment);
      const timeToUse = Math.min(workEnd - retoolStart, retoolTime);
      if (timeToUse > 0) {
        opSegments.push({ date: targetDateStr, start: retoolStart, finish: retoolStart + timeToUse, isRetool: true });
        availableStart = retoolStart + timeToUse;
        freeInterval = workEnd - availableStart;
        isRetoolSegmentDefined = (timeToUse === retoolTime);
      }
    }

    if (freeInterval > 0 && isRetoolSegmentDefined) {
      const opStartChunk = Math.max(availableStart, moment); // FIX
      const chunkAllowed = workEnd - opStartChunk;
      if (chunkAllowed > 0) {
        const timeToUse = Math.min(chunkAllowed, opRequired - onPlaned);
        if (timeToUse > 0) {
          opSegments.push({ date: targetDateStr, start: opStartChunk, finish: opStartChunk + timeToUse, isRetool: false });
          onPlaned += timeToUse;
          availableStart = opStartChunk + timeToUse;
        }
      }
    }
  }

  if (onPlaned < opRequired) {
    // ищем первый СЛЕДУЮЩИЙ рабочий день
    let nd = addDaysInZone(targetDate, 1, schedule.timeZone);
    let ndStr = YYYYMMDDTZ(nd, schedule.timeZone);
    while (true) {
      const wd = generateCalendarItemOnServer(ndStr, schedule);
      if (wd.timeFinishWork > wd.timeStartWork) break;
      nd = addDaysInZone(nd, 1, schedule.timeZone);
      ndStr = YYYYMMDDTZ(nd, schedule.timeZone);
      if (ndStr > stopDateStr) {
        return { success: false, opSegments: [], message: `нет рабочих дней до ${stopDateStr}` };
      }
    }

    // если следующий рабочий день начинается с busy и до неё остаток не влазит — рестарт ПОСЛЕ неё
    const loadsNext = unitLoadItems
      .filter(l => l.unit.id === unit.id && l.date === ndStr)
      .sort((a, b) => a.timeStart - b.timeStart);

    const nextWork = generateCalendarItemOnServer(ndStr, schedule);
    const nextStart = nextWork.timeStartWork;
    const nextEnd = nextWork.timeFinishWork;

    const firstBusy = loadsNext.find(l => l.timeFinish > nextStart);
    const gapEnd = firstBusy ? firstBusy.timeStart : nextEnd;
    const gap = gapEnd - nextStart;

    const remaining = (isRetoolSegmentDefined ? 0 : retoolTime) + (opRequired - onPlaned);

    if (firstBusy && gap < remaining) {
      // полный сброс операции и рестарт НА СЛЕД. ДЕНЬ ПОСЛЕ первой busy
      return findAvailableSegmentsDay(
        userId, locale, ndStr, firstBusy.timeFinish, stopDateStr,
        [], unit, retoolTime, opRequired, 0,
        unitLoadItems, schedule, exceptionItems, interruptible, totalRequired, false
      );
    }

    // иначе продолжаем обычным переходом на следующий день с moment = 0
    return findAvailableSegmentsDay(
      userId, locale, ndStr, 0, stopDateStr, opSegments, unit,
      retoolTime, opRequired, onPlaned, unitLoadItems, schedule,
      exceptionItems, interruptible, totalRequired, isRetoolSegmentDefined
    );
  }

  // ── ОХРАНА ПЕРВОГО ДНЯ ───────────────────────────────────────
  // FIX: подтягиваем до moment и ретул, и оп-сегменты первого дня
  opSegments = opSegments.map(s => {
    if (s.date === targetDateStr && s.start < moment) {
      const dur = s.finish - s.start;
      const newStart = moment;
      const newFinish = newStart + dur;
      // console.warn("[GUARD] raise to moment", { targetDateStr, was: s, now: { ...s, start: newStart, finish: newFinish } });
      return { ...s, start: newStart, finish: newFinish };
    }
    return s;
  }).filter(s => s.finish > s.start);

  return { success: true, opSegments, message: "" };
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
    const stopDateStr = YYYYMMDDTZ(stopDate_, shedule_.timeZone);

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
                // message = message.concat(`Не хватает продукта ${innProduct.product.title} (код: ${innProduct.code}). Недостаточно: ${innProduct.qtu - matchingReadyProduct.qtu} единиц.\n`);
                message = message.concat(`${t('mes.notEnoughtProduct')} ${innProduct.product.title} (${t('mes.code')}: ${innProduct.code}). ${t('mes.notEnought')}: ${innProduct.qtu - matchingReadyProduct.qtu} единиц.\n`);
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
            // message = message.concat(`Не хватает продукта ${innProduct.product.title} (код: ${innProduct.code}). Недостаточно: ${innProduct.qtu} единиц.\n`);
            message = message.concat(`${t('mes.notEnoughtProduct')} ${innProduct.product.title} (${t('mes.code')}: ${innProduct.code}). ${t('mes.notEnought')}: ${innProduct.qtu} единиц.\n`);

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
          // message: `Не все операции готовы к планированию или карта несогласована ${message}`
          message: `${t('mes.cardIsNotReconciled')} ${message}`
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
            // message = `Нет ни одного юнита который может выполнить действие  ${operation.action.title}`;
            message = `${t('mes.noUnitsForAction')}: ${operation.action.title}`;
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

            // console.log('{ maxDateSource, maxTimeSource }', { maxDateSource, maxTimeSource })

            if (new Date(maxDateSource).getTime() < today.getTime() || operation.inn.length === 0) {
              maxDateSource = today_;
              maxTimeSource = 0
            }
            // console.log('{ maxDateSource = today_; maxTimeSource = 0}', { maxDateSource, maxTimeSource })

            // Возвращаем юнит с добавленной операцией,  если юнит не нашелся возвращаем  undefined
            const resultPlaning = findAvailableTimeForOperation(
              userId,
              locale,
              tCard,
              compatibleuUnits,
              unitActions,
              updatedUnitLoads,
              operation,
              maxDateSource,
              maxTimeSource,
              stopDateStr,
              shedule_,
              exceptionItems,
              isPinned
            );
            // console.log('resultPlaning.planedUnitLoads', resultPlaning.planedUnitLoads);

            // если не удалось запланировать то прерываем расчет
            if (!resultPlaning.success) {
              // message = `Действие - A${operation.idc}: ${resultPlaning.message}`;
              message = `${t('mes.action')} - A${operation.idc}: ${resultPlaning.message}`;
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
      message = `${t('mes.onlyPreparedOperPossiblePlan')} ${t('mes.action')}: A${operation.idc} (${operation.action.title})`
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