
import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import type { JSX } from "react";

import styles from "./planScaleContainer.module.scss";

import { CalendarItem, UnitLoadItem, UnitBelongEnum, UnitExceptionItem, UnitItem, SettingsItem, ScheduleItem, TCardItem, TimeTypeEnum, UnitActionItem, TimeZoneEnum } from "@/types/types";

import { generateCalendarItem } from "@/lib/common/utils";
import { isWeekend, isHoliday, isAdditionalTime, idDay } from "@/lib/common/utils";

import LoadInner from "./LoadInner/loadInner";
import LoadOuter from "./LoadOuter/loadOuter";
import DottedLine from "./DottedLine/dottedLine";
import UnitMenu from "./UnitMenu/unitMenu";
import { getCurrentDateInDate, addDaysInZone, getCurrentDateInString, getTimeZoneDateFromDateString } from "@/lib/client/timezone.client"
import { useTranslation } from 'react-i18next';

import { useResizeObserver } from './useResizeObserver'; // Хук отслеживания расмеров окна
import { exceptionsByDateUnit, loadsByDateUnit, hourStyleFoo } from './useResizeObserver'; // оптимизация рендера

import { YYYYMMDDTZ } from "@/lib/common/timezone";
// import { ulogger } from "./../lib/common/universal-logger";

// расчет ширины дня
const calculateWidthDay = (totalWidth: number, scale: number): number => {
  // Преобразуем «новый» ui-диапазон 10..100 в «старый» 10..150 линейно:
  // 10 -> 10, 100 -> 150
  const internal = 10 + (scale - 10) * (190 / 90);
  return (totalWidth * internal) / 100;
};

// общий helper для старт/финиш-точек аутсорта
export const getOuterPointId = (
  load: UnitLoadItem,
  edge: 'start' | 'finish'
): string => {
  // карта + операция + версия + тип точки
  return `outer-${edge}-${load.id_tCard}-${load.idc_oper}-${load.version}`;
};

// вычисление связующих линий оутсорта
interface Line {
  unitId: number;
  startDate: string;   // 'YYYY-MM-DD'
  endDate: string;
  startTime: number;   // минуты от 0 до 1440
  endTime: number;

  hasHiddenStart?: boolean; // начало вне видимой области
  hasHiddenEnd?: boolean;   // конец вне видимой области
}

const createLines = (part: string, date: string, unitLoads: UnitLoadItem[]): Line[] => {
  const outerloads = unitLoads.filter(lo => {
    if (part === "Plus") {
      return lo.date >= date && lo.unit.belong === UnitBelongEnum.outer;
    }
    if (part === "Minus") {
      return lo.date < date && lo.unit.belong === UnitBelongEnum.outer;
    }
    return false;
  });


  const groupedLoads = outerloads.reduce((acc, load) => {
    const key = load.version; // <--- ВОТ ТУТ ИЗМЕНЕНИЕ
    if (!acc[key]) acc[key] = [];
    acc[key].push(load);
    return acc;
  }, {} as Record<number, UnitLoadItem[]>);

  return Object.values(groupedLoads)
    .map(group => {
      // сортируем по дате+времени
      const sorted = group.sort((a, b) => {
        if (a.date === b.date) return a.timeStart - b.timeStart;
        return a.date < b.date ? -1 : 1;
      });

      if (sorted.length < 2) return null;

      const start = sorted[0];
      const end = sorted[sorted.length - 1];

      return {
        unitId: start.unit.id,     // внешний юнит один и тот же
        startDate: start.date,
        endDate: end.date,
        startTime: start.timeStart,
        endTime: end.timeStart,
      } as Line;
    })
    .filter((x): x is Line => x !== null);
};


const dayNeedToMissForTimeScale = (_day: Date, settings: SettingsItem, schedule: ScheduleItem, timezone: string) => {

  if (!settings.showWeekend && isWeekend(_day, schedule) && !isAdditionalTime(_day, schedule)) {
    return true
  }
  if (!settings.showHoliday && isHoliday(_day, schedule) && !isAdditionalTime(_day, schedule)) {
    return true
  }
  return false
}

function insertCalendarSorted(targetRef: React.MutableRefObject<CalendarItem[]>, item: CalendarItem) {
  const arr = targetRef.current;
  // если уже есть — ничего не делаем
  if (arr.find(a => a.idDay === item.idDay)) return;

  // бинарный поиск позиции по строке даты (YYYY-MM-DD)
  let l = 0, r = arr.length;
  while (l < r) {
    const m = (l + r) >> 1;
    if (arr[m].date < item.date) l = m + 1; else r = m;
  }
  // вставка без полной сортировки
  targetRef.current = [...arr.slice(0, l), item, ...arr.slice(l)];
}

export interface PlanScaleContainerProps {
  tCards: TCardItem[],
  units: UnitItem[],
  unitLoads: UnitLoadItem[],
  settings: SettingsItem,
  schedule: ScheduleItem,
  tCardPrepared: TCardItem,
  tCardLighted: TCardItem,
  unitExceptions: UnitExceptionItem[],
  erazLoadHandler: (load_idc: number) => void,
  moveLoadHandler: (load: UnitLoadItem, unit: UnitItem, date: string, timeStart: number, timeFinish: number) => Promise<void>,
  pinLoadHandler: (oper_id: number, version: number) => void,
  unPinLoadHandler: (oper_id: number, tCardId: number, version: number) => void
  unitActions: UnitActionItem[],
  timezone: string
}

export default function PlanScaleContainer({
  tCards,
  units,
  unitLoads,
  settings,
  schedule,
  tCardLighted,
  unitExceptions,
  erazLoadHandler,
  moveLoadHandler,
  pinLoadHandler,
  unPinLoadHandler,
  unitActions,
  timezone

}: PlanScaleContainerProps) {

  const { t, i18n } = useTranslation();

  const divRef = useRef<HTMLDivElement | null>(null);  // Ссылка на div контейнер в котором временная шкала    
  const divRefPlus = useRef<HTMLDivElement | null>(null);  // Ссылка на div контейнер в котором планирование
  const divRefMinus = useRef<HTMLDivElement | null>(null);  // Ссылка на div контейнер в котором История

  const prevDayWidthRef = useRef<number>(0);
  const isResettingRef = useRef(false);

  const [shift, setShift] = useState(0); // Сдвиг шкалы от левого края и старт день сегодня
  const calendarPlus = useRef([] as CalendarItem[]); // хранение дней шкалы времени то что можно планировать
  const calendarMinus = useRef([] as CalendarItem[]); // хранение дней шкалы времени то что уже история
  const visibleItemsPlus = useRef([] as string[]); // хранение дней шкалы времени то что уже история
  const visibleItemsMinus = useRef([] as string[]); // хранение дней шкалы времени то что уже история

  const [calendarViewPlus, setCalendarViewPlus] = useState([] as CalendarItem[]); // [прорисовка шкалы времени планирование при изменении]
  const [calendarViewMinus, setCalendarViewMinus] = useState([] as CalendarItem[]); // [прорисовка шкалы времени история при изменении]

  const [isLoadingDrop, setIsLoadingDrop] = useState(NaN); // для отработки задержки при перетаскивании 

  // Прорисовка соединительных линий лоадов аутсорта
  const [linesPlusReactNodes, setLinesPlusReactNodes] = useState<JSX.Element[]>([]);
  const [linesMinusReactNodes, setLinesMinusReactNodes] = useState<JSX.Element[]>([]);


  const [timelineWidth, setTimelineWidth] = useState(0); //видимая ширина временной шкалы
  const [scale, setScale] = useState(30); // содержит Масштаб (10% - 100%)  
  const [isDraggingScale, setIsDraggingScale] = useState(false); // Состояние для отслеживания перетаскивания
  const [draggingLoad, setDraggingLoad] = useState(undefined as UnitLoadItem | undefined); // перетаскиваемый лоад
  const scaleRestart = useRef(false as boolean); // запускает useEffect прорисовки

  const [contectMenuShow, setContectMenuShow] = useState(0); // содержит operation.id и показывает контекстное меню 
  const [unitMenuShow, setUnitMenuShow] = useState(0); // содержит operation.id и показывает контекстное меню 

  const unitsViewInner = useRef([] as UnitItem[]); // Список заголовков юнитов наших
  const unitsViewOuter = useRef([] as UnitItem[]); // Список заголовков юнитов внешних оутсортеров

  // ширина дня на шкале  зависит от масштаба и размера окна
  const dayWidth = React.useMemo(
    () => (timelineWidth === 0 ? 0 : calculateWidthDay(timelineWidth, scale)),
    [timelineWidth, scale]
  );

  // ⚡ Индексы по датам/юнитам — считаем один раз на входные массивы
  const loadsByDateUnitMap = React.useMemo(
    () => loadsByDateUnit(unitLoads),
    [unitLoads]
  );

  const exceptionsByDateUnitMap = React.useMemo(
    () => exceptionsByDateUnit(unitExceptions),
    [unitExceptions]
  );

  // рабочий диапазон дня (как в generateTimeScalePlan)
  const timeFinishWork = settings.timeFinishWork === 0 ? 1440 : settings.timeFinishWork;
  const startQuant = Math.floor(settings.timeStartWork / 5);
  const finishQuant = Math.ceil(timeFinishWork / 5);
  const minutesPerDay = (finishQuant - startQuant) * 5;
  const dayStartMinutes = startQuant * 5;

  const pxPerMinute =
    dayWidth > 0 && minutesPerDay > 0
      ? dayWidth / minutesPerDay
      : 0;


  let today = getCurrentDateInDate(timezone);
  const todayStr = getCurrentDateInString(timezone);

  // нужно ли пропустить этот день?
  while (dayNeedToMissForTimeScale(today, settings, schedule, timezone)) {
    today = addDaysInZone(today, 1, timezone);
  }

  const todayDateRef = useRef(idDay(today));
  if (idDay(today) !== todayDateRef.current) {
    todayDateRef.current = idDay(today);
  }

  // ШКАЛА
  // сброс шкалы
  const scaleReset = () => {
    isResettingRef.current = true;   // ← сообщаем эффектам, что это reset
    setShift(0);
    setScale(30);
    calendarPlus.current = [] as CalendarItem[];
    calendarMinus.current = [] as CalendarItem[];
    setCalendarViewPlus([] as CalendarItem[]);
    setCalendarViewMinus([] as CalendarItem[]);
    scaleRestart.current = true;
  }

  const handleScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = Number(event.target.value);
    setScale(newScale);
  };
  // динамический расчет сдвига при изменении масштаба
  const computeDynamicShift = (
    oldShift: number,
    oldDayWidth: number,
    newDayWidth: number,
    focusPointPx: number
  ): number => {
    const dayIndexAtFocus = (focusPointPx - oldShift) / oldDayWidth;
    return focusPointPx - dayIndexAtFocus * newDayWidth; // без округления
  };

  // const updateSize = () => {
  //   if (!divRef.current) return;

  //   const rect = divRef.current.getBoundingClientRect();
  //   const newTimelineWidth = rect.width;
  //   const newDayWidth = calculateWidthDay(newTimelineWidth, scale);

  //   // Пересчёт shift, только если размеры уже есть
  //   if (timelineWidth > 0 && dayWidth > 0 && dayWidth !== newDayWidth) {
  //     // const newShift = computeDynamicShift(shift, dayWidth, newDayWidth, newTimelineWidth);
  //     const focusPx = getZoomAnchorPx(); // тот же якорь, что и при зуме
  //     const newShift = computeDynamicShift(shift, dayWidth, newDayWidth, focusPx);
  //     setShift(newShift);
  //   }

  //   setTimelineWidth(newTimelineWidth);

  // };

  const updateSize = useCallback(() => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    const newTimelineWidth = rect.width;
    const newDayWidth = calculateWidthDay(newTimelineWidth, scale);

    setTimelineWidth(prevWidth => {
      // если реально не изменилось — не трогаем стейт
      if (Math.abs(prevWidth - newTimelineWidth) < 1) return prevWidth;
      return newTimelineWidth;
    });

    if (timelineWidth > 0 && dayWidth > 0 && dayWidth !== newDayWidth) {
      const focusPx = getZoomAnchorPx();
      const newShift = computeDynamicShift(shift, dayWidth, newDayWidth, focusPx);
      setShift(newShift);
    }
  }, [scale, shift, dayWidth, timelineWidth]);


  // хук отслеживания изменеия размера видимой части шкалы
  // useResizeObserver(divRef, () => {
  //   // твой пересчёт при изменении размеров контейнера
  //   updateSize();
  // }, 200); // дебаунс 300мс

  useResizeObserver(divRef, updateSize, 200);


  let stopCloseMenuload = 0;
  let stopCloseMenuUnit = 0;

  // изменение при смене массива загрузки, может прорисоватся и при сохранении и при накидывании драфта
  useEffect(() => {
    //  получаем  планировку юнитов
    // Из загрузки вытаскиваем список юнитов и делим его на свой чужой;
    unitsViewInner.current = units.filter(elem => elem.belong === UnitBelongEnum.inner);
    unitsViewOuter.current = units.filter(elem => elem.belong === UnitBelongEnum.outer);


    // реализуем ленивую загрузку   
    // генерим стартовый день,  в соответствии с настройкой видимости
    // но сначала проверим чтоб не задвоить его случайно    
    // if (!calendarPlus.current.find(elem => elem.idDay === idDay(today))) {
    if (!calendarPlus.current.find(elem => elem.idDay === todayDateRef.current)) {
      // optim
      // calendarPlus.current = [...calendarPlus.current, generateCalendarItem(todayDateRef.current, schedule)];
      insertCalendarSorted(calendarPlus, generateCalendarItem(todayDateRef.current, schedule));
    }

    //  прорисовываем шкалу планирования
    // и убираем все что меньше текущей даты если случайно попали на смену дат
    const filteredCalendar = calendarPlus.current.filter(item => item.date >= todayDateRef.current);
    setCalendarViewPlus(filteredCalendar);

  }, [unitLoads]);

  // хелпер: где центр зума — центр контейнера   
  const getZoomAnchorPx = () => {
    return timelineWidth / 2;
  };

  // сохраняем предыдущее значение ширины дня
  useEffect(() => {
    prevDayWidthRef.current = dayWidth;
  }, [dayWidth]);

  // когда изменилась ширина дня (масштаб или ширина контейнера) — двигаем shift
  useLayoutEffect(() => {
    const prev = prevDayWidthRef.current;
    const next = dayWidth;
    if (!prev || !next || prev === next) return;

    if (isResettingRef.current) {
      // При сбросе жёстко ставим «сегодня» к левой границе
      setShift(0);
      isResettingRef.current = false;
      prevDayWidthRef.current = next;
      return;
    }

    const focusPx = getZoomAnchorPx();                 // якорь зума в px
    const dayIndexAtFocus = (focusPx - shift) / prev;  // какой «индекс дня» был под якорем
    const newShift = focusPx - dayIndexAtFocus * next;

    if (newShift !== shift) setShift(newShift);
    // обновим ref, чтобы следующая итерация знала «старую» ширину
    prevDayWidthRef.current = next;
  }, [dayWidth, shift, timelineWidth]);


  useLayoutEffect(() => {
    if (timelineWidth === 0) return;

    // 1) пересчитываем видимые дни
    // Ширину дня при изменении scale лежит в мемо dayWidth
    // Вычисляем видимые элементы  беру сегодня как стартовую дату
    visibleItemsPlus.current = calculateVisibleItemsPlus(todayStr, timelineWidth, dayWidth, shift);
    // Вычисляем видимые элементы  в прошлое беру сегодня как финишную дату, отсчет обратный
    visibleItemsMinus.current = calculateVisibleItemsMinus(todayStr, timelineWidth, dayWidth, shift);

    // 2) обновляем календари (как было)
    //  прорисовываем шкалу планирования
    // и убираем все что меньше текущей даты если случайно попали на смену дат
    const filteredCalendar = calendarPlus.current.filter(item => item.date >= todayStr);
    setCalendarViewPlus(filteredCalendar);
    //  прорисовываем шкалу истории
    setCalendarViewMinus(calendarMinus.current);

    // 3) СТРОИМ ЛИНИИ УЖЕ ПО АКТУАЛЬНЫМ КАЛЕНДАРЯМ
    const todayIso = today.toLocaleDateString("en-CA"); // та же дата, что выше в createLines

    const plusLines = createLines("Plus", todayIso, unitLoads);
    const minusLines = createLines("Minus", todayIso, unitLoads);

    setLinesPlusReactNodes(
      buildLineNodes(plusLines, filteredCalendar, divRefPlus, shift)
    );
    setLinesMinusReactNodes(
      buildLineNodes(minusLines, calendarMinus.current, divRefMinus, shift)
    );
  }, [timelineWidth, shift, scale, todayStr, unitLoads]);
  // timelineWidth-изменение размеров экрана
  //shift  -сдвиг временной шкалы
  //scale  - изменение масштаба
  //todayStr  - изменение текущей даты
  // ⬆️ добавили unitLoads, чтобы линии обновлялись при изменении загрузки



  // useLayoutEffect(() => {
  //   if (timelineWidth === 0) return;
  //   // Ширину дня при изменении scale лежит в мемо dayWidth
  //   // Вычисляем видимые элементы  беру сегодня как стартовую дату
  //   visibleItemsPlus.current = calculateVisibleItemsPlus(todayStr, timelineWidth, dayWidth, shift);
  //   // Вычисляем видимые элементы  в прошлое беру сегодня как финишную дату, отсчет обратный      
  //   visibleItemsMinus.current = calculateVisibleItemsMinus(todayStr, timelineWidth, dayWidth, shift);

  //   //  прорисовываем шкалу планирования
  //   // и убираем все что меньше текущей даты если случайно попали на смену дат
  //   const filteredCalendar = calendarPlus.current.filter(item => item.date >= todayStr);
  //   setCalendarViewPlus(filteredCalendar);
  //   //  прорисовываем шкалу истории
  //   setCalendarViewMinus(calendarMinus.current);
  // }, [timelineWidth, shift, scale, todayStr]); // ⬅️ было todayDateRef — это ref-объект, он не триггерит

  // // timelineWidth-изменение размеров экрана
  // //shift  -сдвиг временной шкалы
  // //scale  - изменение масштаба
  // //todayStr  - изменение текущей даты

  const calculateVisibleItemsPlus = (dayStr: string, timelineWidth: number, dayWidth: number, shift: number) => {
    // стартовый день для расчета видимых дней на шкале
    const day = getTimeZoneDateFromDateString(dayStr, timezone);
    const startDay = addDaysInZone(day, 0, timezone); //  убираю мутабельность и остаюсь в таймзоне команды
    // если shift>0 тоэто сдвиг вперед
    // если shift<0 тоэто сдвиг назад

    // начало отсчета дней от today    
    // видимые координаты на шкале
    const visibleleft = shift > 0 ? 0 : - shift;
    const visibleright = timelineWidth - shift

    const _visibleItems = [] as string[] // ID дней которые видны
    // определяем оставшуюся шкалу с учетом сдвига от сегодня
    //  если был положительный сдвиг она уменьшится а если отрицательный увеличится 
    // дни надо сгенерить на всю шкалу

    let _timelineWidth = timelineWidth - shift;
    let _day = startDay; // временная переменная для дней  буду ее инкрементировать
    let countDay = 0;

    while (_timelineWidth > 0) {
      // нужно ли пропустить этот день?
      if (dayNeedToMissForTimeScale(_day, settings, schedule, timezone)) {
        _day = addDaysInZone(_day, 1, timezone);
        continue
      }

      // уменьшаем ширину на ширину дня
      _timelineWidth = _timelineWidth - dayWidth

      // обрабатываем только в том случае если день попадает в видимый диапазон       
      if (_timelineWidth + shift > timelineWidth) {
        _day = addDaysInZone(_day, 1, timezone);
        continue;
      }

      const id_day = idDay(_day);

      if (!calendarPlus.current.find(elem => elem.idDay === id_day)) {
        insertCalendarSorted(calendarPlus, generateCalendarItem(id_day, schedule));
      }

      // координаты дня  на временной шкале
      const dayLeft = dayWidth * countDay;
      countDay++;
      const dayRight = dayWidth * countDay;

      if (dayRight > visibleleft && dayLeft < visibleright) {
        if (!_visibleItems.find(elem => elem === id_day)) {
          _visibleItems.push(id_day)
        }

      }

      // Добавляем один день
      _day = addDaysInZone(_day, 1, timezone);
    }
    return _visibleItems;
  };

  const calculateVisibleItemsMinus = (dayStr: string, timelineWidth: number, dayWidth: number, shift: number) => {
    // если shift>0 тоэто сдвиг вперед
    // если shift<0 тоэто сдвиг назад
    const day = getTimeZoneDateFromDateString(dayStr, timezone);
    const startDay = addDaysInZone(day, 0, timezone); //  убираю мутабельность и остаюсь в таймзоне команды
    // видимые координаты на шкале
    const visibleleft = 0 - shift;
    const visibleright = (shift > timelineWidth) ? -(shift - timelineWidth) : 0;

    const _visibleItems = [] as string[] // ID дней которые видны

    let countDay = 0;
    // если сдвиг положительный то нужно отстроить дни в прошлое
    //  буду сдвиг отсчитывать от сегодня
    if (shift > 0) {
      let _shift = shift; // сдвег в прошлое           
      let _dayPast = addDaysInZone(startDay, -1, timezone);

      while (_shift > 0) {

        // если  день приходится на выходные  и в настройках указано что мы скрываем выходные и нет доп часов
        // крутим до первого буднего дня
        while (!settings.showWeekend && isWeekend(_dayPast, schedule) && !isAdditionalTime(_dayPast, schedule)) {
          _dayPast = addDaysInZone(_dayPast, -1, timezone);
        }
        // если  день приходится на праздники  и в настройках указано что мы скрываем праздники и нет доп часов
        // крутим до первого буднего дня
        while (!settings.showHoliday && isHoliday(_dayPast, schedule) && !isAdditionalTime(_dayPast, schedule)) {
          _dayPast = addDaysInZone(_dayPast, -1, timezone);
        }

        const id_day = idDay(_dayPast); //  сгенерили
        if (!calendarMinus.current.find(elem => elem.idDay === id_day)) {
          insertCalendarSorted(calendarMinus, generateCalendarItem(id_day, schedule));
        }

        _shift = _shift - dayWidth; // инкрементировали сдвиг

        // координаты дня  на временной шкале
        const dayRight = dayWidth * countDay;;
        countDay++;
        const dayLeft = -(dayWidth * countDay)

        if (dayRight > visibleleft && dayLeft < visibleright) {
          if (!_visibleItems.find(elem => elem === id_day)) {
            _visibleItems.push(id_day)
          }

        }
        // от сегодня сдвинули в прошлое день
        _dayPast = addDaysInZone(_dayPast, -1, timezone);
      }
    }
    return _visibleItems;
  };

  // ПЕРЕТАСКИВАНИЕ ЛОАДА

  // Для изменения курсора
  const dragOffsetX = useRef<number>(0);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, load: UnitLoadItem) => {
    if (e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      dragOffsetX.current = e.clientX - rect.left;
      setDraggingLoad(load);
    }
  };


  const handleDropOper = async (
    event: React.DragEvent,
    toUnitView: UnitItem
  ) => {
    event.preventDefault();
    if (!draggingLoad || !divRefPlus.current) return;

    setIsLoadingDrop(draggingLoad.version);

    const containerRect = divRefPlus.current.getBoundingClientRect();

    const timeFinishWork = settings.timeFinishWork === 0 ? 1440 : settings.timeFinishWork;
    const startQuant = Math.floor(settings.timeStartWork / 5);
    const finishQuant = Math.ceil(timeFinishWork / 5);
    const quants = finishQuant - startQuant;


    const fullDayWidth = dayWidth;
    const pxPerQuant = fullDayWidth / quants;
    const pxPerMinute = pxPerQuant / 5;

    const isDraggingRetul = draggingLoad.isRetool === true;

    // ✨ внеш/внутр:
    const isExternal = toUnitView.belong === UnitBelongEnum.outer;
    // ✨ какой конец тащим у внешнего:
    const dragEdge: 'start' | 'finish' = (draggingLoad as UnitLoadItem).isOuterFinish ? 'finish' : 'start';

    // ✨ для внешнего короткий отрезок визуально = 1 квант (5 минут)
    const quantWidth = fullDayWidth / quants;
    const handleWidthPx = quantWidth;

    // 🧩 смещение retool — только для ВНУТРЕННИХ и только когда тащим саму операцию
    const retoolDurationPx =
      !isDraggingRetul &&
        toUnitView.retool &&
        toUnitView.belong === UnitBelongEnum.inner
        ? toUnitView.retool * pxPerMinute
        : 0;

    // ✨ главный фикс: выбираем якорь
    // - inner: как было (курсор внутри элемента + retool)
    // - external/start: якорь = 0 (левый край = время под курсором)
    // - external/finish: якорь = ширина сегмента (правый край = время под курсором)
    const anchorOffsetPx = isExternal
      ? (dragEdge === 'start' ? 0 : handleWidthPx)
      : (dragOffsetX.current + retoolDurationPx);

    const leftEdgeX = event.clientX - anchorOffsetPx; // ✨
    const relativeX = leftEdgeX - containerRect.left + divRefPlus.current.scrollLeft;

    // День
    const dayIndex = Math.floor(relativeX / fullDayWidth);
    const calendarItem = calendarViewPlus[dayIndex];
    if (!calendarItem) {
      setIsLoadingDrop(NaN);
      return;
    }

    const dayLeft = dayIndex * fullDayWidth;
    const offsetWithinDay = relativeX - dayLeft;

    // Кванты
    // ✨ тут ничего спец. делать не нужно: для finish мы уже сдвинули leftEdgeX на ширину сегмента,
    // поэтому вычисленный quantIndex соответствует ЛЕВОЙ границе короткого сегмента,
    // а его правая граница (finish-момент) окажется ровно под курсором.
    const quantIndex = Math.floor(offsetWithinDay / quantWidth);
    const timeStart = (startQuant + quantIndex) * 5;
    const timeFinish = timeStart + 5; // короткий внешний сегмент — 1 квант

    await moveLoadHandler(
      draggingLoad,
      toUnitView,
      calendarItem.date,
      timeStart,
      timeFinish
    );

    setDraggingLoad(undefined);
    setIsLoadingDrop(NaN);
  };


  const handleMouseDownOper = (e: React.MouseEvent<HTMLDivElement>, load: UnitLoadItem) => {
    setDraggingLoad(load);
  };

  const handleMouseUpOper = () => {
    setDraggingLoad(undefined);

  };

  const handleMouseLeaveOper = () => {
    // Если курсор покинул шкалу, завершаем перетаскивание
    setDraggingLoad(undefined);

  };



  //// ШКАЛА
  // Для перетаскивания  шкалы 
  const rafId = useRef<number | null>(null);

  const handleMouseDownScale = (e: React.MouseEvent) => {
    // Нажата правая кнопка мыши 2 - тащим шкалу
    // Нажата правая кнопка мыши 0 - тащим операцию на шкале
    if (e.button !== 2) return;

    setIsDraggingScale(true);  // Включаем перетаскивание (для прорисовки эффектов)
    let isDragging_ = true;    // Включаем перетаскивание (для внутренней логики)

    const startX = e.clientX;  // Сохраняем начальную позицию мыши X
    const startShift = shift;  // Сохраняем начальный сдвиг

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging_) return;
      const diff = moveEvent.clientX - startX; // Разница в позиции
      const next = startShift + diff; // Новый сдвиг на основе разницы

      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        setShift(next); // Сохраняем новый сдвиг
      });
    };

    const onMouseUp = () => {
      isDragging_ = false; // Завершаем перетаскивание
      setIsDraggingScale(false); // Завершаем перетаскивание
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      window.removeEventListener('mousemove', onMouseMove, true); // Убираем обработчики
      window.removeEventListener('mouseup', onMouseUp, true); // Убираем обработчики
    };

    window.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('mouseup', onMouseUp, true);
  };

  // Функция ПРОРИСОВКИ  шкалы времени для одного дня  и загруза юнитов для одного дня
  const generateTimeScalePlan = (calendarItem: CalendarItem) => {
    // 288 5 минуток в дне (24 часа * 60/5 минут)  если показывать полные сутки

    // Округляем время начала работы до целого числа
    const startQuant = Math.floor(settings.timeStartWork / 5);
    // Если время завершения работы равно 0, присваиваем значение 1440
    const timeFinishWork = settings.timeFinishWork === 0 ? 1440 : settings.timeFinishWork;
    // Округляем время завершения работы до целого числа и добавляем 1
    const finishQuant = Math.ceil(timeFinishWork / 5);
    // Рассчитываем количество промежуточных значений
    const quants = finishQuant - startQuant;


    const dayScale = [];
    for (let i = startQuant; i < finishQuant; i++) {
      const intervTime = i * 5;
      const isWorkTime = intervTime >= calendarItem.timeStartWork && intervTime < calendarItem.timeFinishWork;
      const isBreakTime = calendarItem.breaks.some(breakPeriod =>
        intervTime >= breakPeriod.timeStart && intervTime < breakPeriod.timeFinish
      );

      //  расписание предприятия
      const timeStyle = isBreakTime
        ? styles.breakTime  // Если время перерыв, применяем стиль для перерыва
        : isWorkTime
          ? styles.workTime  // Если это рабочее время, применяем стиль для рабочего времени
          : styles.nonWorkTime;  // Если не рабочее и не перерыв, применяем стиль для не рабочего времени

      // // Время в 5 минут
      const hours = Math.floor(i / 12);  // Часы
      const minutes = (i % 12) * 5;         // Минуты в интервале 5 минут

      const { hourStyle, hoursValue, minutesValue } = hourStyleFoo(scale, hours, minutes,
        {
          interval4hours: styles.interval4hours,
          interval1hour: styles.interval1hour,
          interval30min: styles.interval30min,
          interval5min: styles.interval5min,
        }
      );

      //  вычисление визуализации загруза юнитов
      // Внутренние         
      const unitLoadBlockseReactNodesInner = unitsViewInner.current.map(unitView => {

        let unit_unloadEx = "";
        const exs = exceptionsByDateUnitMap.get(`${calendarItem.date}|${unitView.id}`) || [];

        if (exs.length > 0) {
          // Если есть исключения устанавливатся новое время работы  индивидуально юниту
          // в этом случае оно заменяет общее расписание (Type Work)
          //  также устанавливаютсядругие перерывы на эту дату если изменилось время работы
          // либо может быть установлено не работа

          const exNotWork = exs.find(ex =>
            ex.type === TimeTypeEnum.notWork && intervTime >= ex.timeStart && intervTime < ex.timeFinish)
          if (exNotWork) unit_unloadEx = styles.nonWorkTime

          const exWork = exs.find(ex => ex.type === TimeTypeEnum.work)
          if (exWork) { unit_unloadEx = (intervTime >= exWork.timeStart && intervTime < exWork.timeFinish) ? styles.workTime : styles.nonWorkTime }

          const exBreack = exs.filter(ex => ex.type === TimeTypeEnum.breack)
          const isBreakTimeEx = exBreack.some(breakPeriod =>
            intervTime >= breakPeriod.timeStart && intervTime < breakPeriod.timeFinish
          );
          unit_unloadEx = isBreakTimeEx ? styles.breakTime : unit_unloadEx
        }

        const dateLoad = loadsByDateUnitMap.get(`${calendarItem.date}|${unitView.id}`) || [];

        if (dateLoad.length > 0) {
          // ищем позиции которые начинаются а этом интервале
          const operBlocks = dateLoad.filter(lo => {
            return intervTime <= lo.timeStart && lo.timeStart < (intervTime + 5);
          });

          // Расставляем блоки интервалов на шкале
          const operBlocksReactNodes = operBlocks.map((load, index) => {
            return <LoadInner
              key={index}
              dayWidth={dayWidth}
              quants={quants}
              intervTime={intervTime}
              load={load}
              tCardLighted={tCardLighted}
              tCards={tCards}
              draggingLoad={draggingLoad}
              contectMenuShow={contectMenuShow}
              unitView={unitView}
              erazLoadHandler={erazLoadHandler}
              handleDragStart={handleDragStart}
              handleMouseUpOper={handleMouseUpOper}
              handleRightClickMenu={handleRightClickMenu}
              index={index}
              pinLoadHandler={pinLoadHandler}
              unPinLoadHandler={unPinLoadHandler}
              isLoadingDrop={isLoadingDrop === load.version && !load.isRetool}
            />
          })

          // Это прорисовка загрузок 
          return (<div key={unitView.id}
            onDragOver={e => e.preventDefault()} // Чтобы разрешить drop            
            onDrop={e => handleDropOper(e, unitView)}
            className={`${styles.unit_unload} ${unit_unloadEx}`}>{operBlocksReactNodes}</div>)
        }
        // Это пустые сюда кидаем
        return (<div key={unitView.id}
          onDragOver={e => e.preventDefault()} // Чтобы разрешить drop          
          onDrop={e => handleDropOper(e, unitView)}
          className={`${styles.unit_unload} ${unit_unloadEx}`}></div>); // Если нет совпадений
      });

      //  внешние
      // console.log("внешние", unitsViewOuter.current)
      const unitLoadBlockseReactNodesOuter = unitsViewOuter.current.map(unitView => {

        const dateLoad = loadsByDateUnitMap.get(`${calendarItem.date}|${unitView.id}`) || [];

        if (dateLoad.length > 0) {
          // ищем позиции которые начинаются а этом интервале
          const operBlocks = dateLoad.filter(operation => {
            return intervTime <= operation.timeStart && operation.timeStart < (intervTime + 5);
          });

          // Расставляем блоки интервалов на шкале
          const operBlocksReactNodes = operBlocks.map((load, index) => {
            return <LoadOuter
              key={index}
              dayWidth={dayWidth}
              quants={quants}
              intervTime={intervTime}
              load={load}
              tCardLighted={tCardLighted}
              tCards={tCards}
              draggingLoad={draggingLoad}
              contectMenuShow={contectMenuShow}
              unitView={unitView}
              erazLoadHandler={erazLoadHandler}
              handleMouseDownOper={handleMouseDownOper}
              handleMouseUpOper={handleMouseUpOper}
              handleRightClickMenu={handleRightClickMenu}
              stopCloseMenu={(idc) => { stopCloseMenuload = idc }}
              moveLoadHandler={moveLoadHandler}
            />


          })
          return (<div key={unitView.id}
            onDragOver={e => e.preventDefault()} // Чтобы разрешить drop            
            onDrop={e => handleDropOper(e, unitView)}
            className={styles.unit_unload}
            data-unit-id={unitView.id}               // ⬅️ добавили
          >{operBlocksReactNodes}</div>)
        }
        return (<div key={unitView.id}
          onDragOver={e => e.preventDefault()} // Чтобы разрешить drop          
          onDrop={e => handleDropOper(e, unitView)}
          className={styles.unit_unload}
          data-unit-id={unitView.id}               // ⬅️ добавили
        ></div>); // Если нет совпадений
      });

      dayScale.push(
        <div
          key={`${calendarItem.day}+${i}}`}
          className={`${styles.timeBlock} ${timeStyle} ${hourStyle}`}
          style={{ width: `${dayWidth / quants}px` }} // Делаем каждый блок 1/288 ширины
        >

          <div className={styles.timeLabel}>
            {hoursValue}
            {minutesValue}
          </div>
          {/* загрузка своих Юнитов */}
          <div className={styles.unit_gap} ></div>
          {unitLoadBlockseReactNodesInner}
          {/* загрузка сторонних юнитов */}
          <div className={styles.unit_gap} ></div>
          {unitLoadBlockseReactNodesOuter}
        </div>
      );
    }
    return dayScale;
  };

  // контекстное меню закрытие
  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault(); // Отключаем стандартное контекстное меню
    if (contectMenuShow !== stopCloseMenuload) {
      setContectMenuShow(0);
      stopCloseMenuload = 0;
    }
    stopCloseMenuload = 0;

    if (unitMenuShow !== stopCloseMenuUnit) {
      setUnitMenuShow(0);
      stopCloseMenuUnit = 0;
    }
    stopCloseMenuUnit = 0;
  };
  // контекстное меню
  const handleRightClickMenu = (event: React.MouseEvent, idc: number | undefined) => {
    event.preventDefault();
    event.stopPropagation();
    if (idc) setContectMenuShow(idc);
  };

  // контекстное меню
  const handletClickUnit = (event: React.MouseEvent, idc: number | undefined) => {
    event.preventDefault();
    event.stopPropagation();
    if (idc) setUnitMenuShow(idc);
  };


  const timeScaleReactNodesMinus = calendarViewMinus.map((elem, index) => {
    // console.log("render день минус", elem.date);
    const isVisible = visibleItemsMinus.current.includes(elem.idDay);
    const hoursScaleReactNodes = isVisible ? generateTimeScalePlan(elem) : <div style={{ width: `${dayWidth}px` }} />;

    return (
      <div
        className={styles.day_scale}
        style={{ width: `${dayWidth}px` }} key={`day-${index}`}>

        {(scale > 0) && <span className={styles.day_title}>{elem.idDay}</span>}

        <div className={styles.time_container}>
          {hoursScaleReactNodes}
        </div>
      </div>
    )
  });

  const timeScaleReactNodesPlus = calendarViewPlus.map((elem, index) => {
    const isVisible = visibleItemsPlus.current.includes(elem.idDay);
    const hoursScaleReactNodes = isVisible ? generateTimeScalePlan(elem) : <div style={{ width: `${dayWidth}px` }} />;

    return (
      <div
        className={styles.day_scale}
        style={{ width: `${dayWidth}px` }} key={`day-${index}`}>

        {(scale > 0) && <span className={styles.day_title}>{elem.idDay}</span>}

        {/* // это красная риска сегодня начало дня  */}
        {index === 0 && <div className={styles.today_scale}></div>}

        <div className={styles.time_container}>
          {hoursScaleReactNodes}
        </div>
      </div>
    )
  });

 


  const buildLineNodes = (
    lines: Line[],
    calendar: CalendarItem[],
    containerRef: React.RefObject<HTMLDivElement | null>,
    recalcKey: number,
  ) => {
    if (dayWidth === 0 || pxPerMinute === 0 || calendar.length === 0) return [];

    const totalWidth = calendar.length * dayWidth;
    const offsetX = 30; // как было у тебя

    const clampToDay = (minutes: number) => {
      if (minutes <= dayStartMinutes) return 0;
      const maxMin = dayStartMinutes + minutesPerDay;
      if (minutes >= maxMin) return dayWidth;
      return (minutes - dayStartMinutes) * pxPerMinute;
    };

    return lines
      .map((line, index) => {
        const startIdx = calendar.findIndex(c => c.idDay === line.startDate);
        const endIdx = calendar.findIndex(c => c.idDay === line.endDate);

        // 🔴 ВАЖНОЕ ИЗМЕНЕНИЕ:
        // раньше было "||" — требовали наличие ОБОИХ концов.
        // теперь выбрасываем линию только если оба конца вообще вне календаря.
        if (startIdx === -1 && endIdx === -1) return null;

        // если начало вне окна (раньше всех видимых дней) — прижимаем к левому краю
        const x1 =
          startIdx === -1
            ? 0 + offsetX
            : startIdx * dayWidth + clampToDay(line.startTime) + offsetX;

        // если конец вне окна (позже всех видимых дней) — прижимаем к правому краю
        const x2 =
          endIdx === -1
            ? totalWidth
            : endIdx * dayWidth + clampToDay(line.endTime);

        return (
          <DottedLine
            key={index}
            container={containerRef.current}
            unitId={line.unitId}
            x1={x1}
            x2={x2}
            recalcKey={recalcKey}
          />
        );
      })
      .filter((node): node is JSX.Element => node !== null);
  };

 


  const unitsReactNodesInner = unitsViewInner.current.map(elem => {
    return (
      <div key={elem.id} className={styles.unit_name} onClick={(event) => handletClickUnit(event, elem.idc)}> {elem.title}
        {unitMenuShow === elem.idc && (<UnitMenu unitActions={unitActions.filter(a => a.unitId === elem.id)} />)}
      </div>
    )
  });
  const unitsReactNodesOuter = unitsViewOuter.current.map(elem => {
    return (
      <div key={elem.id} className={styles.unit_name}> {elem.title}</div>
    )
  });
  return (
    <div className={styles.plan_scale_container}

      onContextMenu={handleRightClick}
      onClick={handleRightClick}>

      <div className={styles.plan_scale_container_right}>
        <div className={styles.plug}>
          <button
            className={styles.button_reset}
            onClick={() => scaleReset()}>
            {t('scale.resetScale')}
          </button>
        </div>
        <div className={styles.plug1}></div>
        <div className={styles.units_title}>{t('scale.inner')}</div>
        {unitsReactNodesInner}
        <div className={styles.units_title}> {t('scale.outer')}</div>
        {unitsReactNodesOuter}
        <div className={styles.plug2}></div>
      </div>
      <div ref={divRef} className={styles.plan_scale_container_left}>
        <div className={styles.scale_header}>
          <div className={styles.scale_controls}>
            <input
              className={styles.rangeSlider}
              type="range"
              min="10"
              max="100"
              step="1"
              value={scale}
              onChange={handleScaleChange}
            />
            <label className={styles.rangeSlider_label} > {t('scale.scaleSize')} {Math.round(scale)}%</label>

          </div>

        </div>
        <div className={styles.scale_container}>

          <div className={styles.timeline}
            style={{
              width: `${timelineWidth}px`,
              transform: `translateX(${shift}px)`, // Сдвиг шкалы по оси X  
              cursor: isDraggingScale ? 'grabbing' : 'grab', // Меняем курсор в зависимости от состояния
            }}
            onMouseDown={handleMouseDownScale} // Добавляем обработчик нажатия мыши
          >

            {/* Сдвигаем элементы timeScaleReactNodesMinus на тот же сдвиг */}
            {/* Эти элементы идут перед основными */}
            <div
              ref={divRefMinus}
              style={{
                // backgroundColor: 'yellowgreen',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                position: 'absolute',
                right: `${timelineWidth}px`,
              }}>
              {timeScaleReactNodesMinus}
              {linesMinusReactNodes}
            </div>

            {/* Основные элементы шкалы */}

            <div ref={divRefPlus}
              onMouseLeave={handleMouseLeaveOper}
              style={{
                // backgroundColor: 'yellow',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                position: 'absolute',
                left: '0',
                width: 'fit-content'
              }}>
              {timeScaleReactNodesPlus}
              {linesPlusReactNodes}
            </div>

          </div>
        </div>
      </div>
    </div>

  );
};



