
import React, { useEffect, useState, useRef } from 'react';

import styles from "./planScaleContainer.module.scss";

import { CalendarItem, UnitLoadItem, UnitBelongEnum, UnitExceptionItem, UnitItem, SettingsItem, ScheduleItem, TCardItem, TimeTypeEnum, UnitActionItem } from "@/types/types";

import { generateCalendarItem, isWeekend, isHoliday, isAdditionalTime, idDay } from "@/lib/utils";

import LoadInner from "./LoadInner/loadInner";
import LoadOuter from "./LoadOuter/loadOuter";
import DottedLine from "./DottedLine/dottedLine";
import UnitMenu from "./UnitMenu/unitMenu";

import { useTranslation } from 'react-i18next';

import { useResizeObserver } from './useResizeObserver'; // Хук отслеживания расмеров окна

// расчет ширины дня
const calculateWidthDay = (totalWidth: number, scale: number): number => {
  // Если scale 100%, widthDay = totalWidth
  // Если scale 10%, widthDay = totalWidth / 100
  return (totalWidth * scale) / 100;
};

// вычисление связующих линий оутсорта
interface Line { startId: string, endId: string }
const createLines = (part: string, date: string, unitLoads: UnitLoadItem[]): Line[] => {

  const outerloads = unitLoads.filter(lo => {
    if (part === "Plus") {
      return (lo.date >= date && lo.unit.belong === UnitBelongEnum.outer)
    }
    if (part === "Minus") {
      return (lo.date < date && lo.unit.belong === UnitBelongEnum.outer)
    }
    return false
  })

  // Группируем лоады по idc_oper
  const groupedLoads = outerloads.reduce((acc, load) => {
    const key = load.idc_oper; // группировка по idc_oper
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(load);
    return acc;
  }, {} as Record<number, UnitLoadItem[]>);

  // Для каждой группы сортируем по timeStart и формируем пару
  const linesArray = Object.values(groupedLoads)
    .map(group => {
      // Сортировка по времени начала
      const sorted = group.sort((a, b) => a.timeStart - b.timeStart);
      // Если в группе меньше двух лоадов, пропускаем (или можно обработать ошибку)
      if (sorted.length < 2) return null;
      return {
        startId: String(sorted[0].idc),
        endId: String(sorted[1].idc)
      };
    })
    .filter((pair): pair is { startId: string; endId: string } => pair !== null);

  return linesArray;
};

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
  unitActions:UnitActionItem[]
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
  unitActions

}: PlanScaleContainerProps) {

  const { t, i18n } = useTranslation();


  const divRef = useRef<HTMLDivElement>(null);  // Ссылка на div контейнер в котором временная шкала  
  const divRefPlus = useRef<HTMLDivElement>(null);  // Ссылка на div контейнер в котором планирование
  const divRefMinus = useRef<HTMLDivElement>(null);  // Ссылка на div контейнер в котором История

  const [dayWidth, setDayWidth] = useState(0); // ширина дня на шкале
  const [shift, setShift] = useState(0); // Сдвиг шкалы от левого края и старт день сегодня
  const calendarPlus = useRef([] as CalendarItem[]); // хранение дней шкалы времени то что можно планировать
  const calendarMinus = useRef([] as CalendarItem[]); // хранение дней шкалы времени то что уже история
  const visibleItemsPlus = useRef([] as string[]); // хранение дней шкалы времени то что уже история
  const visibleItemsMinus = useRef([] as string[]); // хранение дней шкалы времени то что уже история

  const [calendarViewPlus, setCalendarViewPlus] = useState([] as CalendarItem[]); // [прорисовка шкалы времени планирование при изменении]
  const [calendarViewMinus, setCalendarViewMinus] = useState([] as CalendarItem[]); // [прорисовка шкалы времени история при изменении]

  const [isLoadingDrop, setIsLoadingDrop] = useState(NaN); // для отработки задержки при перетаскивании 

  // Прорисовка соединительных линий лоадов аутсорта

  const [timelineWidth, setTimelineWidth] = useState(0); //видимая ширина временной шкалы
  const [scale, setScale] = useState(50); // содержит Масштаб (10% - 100%)  
  const [isDraggingScale, setIsDraggingScale] = useState(false); // Состояние для отслеживания перетаскивания
  const [draggingLoad, setDraggingLoad] = useState(undefined as UnitLoadItem | undefined); // перетаскиваемый лоад
  const scaleRestart = useRef(false as boolean); // запускает useEffect прорисовки

  const [contectMenuShow, setContectMenuShow] = useState(0); // содержит operation.id и показывает контекстное меню 
  const [unitMenuShow, setUnitMenuShow] = useState(0); // содержит operation.id и показывает контекстное меню 

  const unitsViewInner = useRef([] as UnitItem[]); // Список заголовков юнитов наших
  const unitsViewOuter = useRef([] as UnitItem[]); // Список заголовков юнитов внешних оутсортеров


  const today = new Date();
  today.setHours(0, 0, 0, 0); // Устанавливаем начало дня (00:00:00.000)

  // если  день приходится на выходные  и в настройках указано что мы скрываем выходные но нет доп часов на это время
  // крутим до первого буднего дня
  while (!settings.showWeekend && isWeekend(today, schedule) && !isAdditionalTime(today, schedule)) {
    today.setDate(today.getDate() + 1);
  }
  // если  день приходится на праздники  и в настройках указано что мы скрываем праздники
  // крутим до первого буднего дня
  while (!settings.showHoliday && isHoliday(today, schedule) && !isAdditionalTime(today, schedule)) {
    today.setDate(today.getDate() + 1);
  }

  const todayDateRef = useRef(idDay(today));
  if (idDay(today) !== todayDateRef.current) {
    todayDateRef.current = idDay(today);
  }

  // ШКАЛА
  // сброс шкалы
  const scaleReset = () => {
    setShift(0);
    setScale(50);
    setDayWidth(0);
    calendarPlus.current = [] as CalendarItem[];
    calendarMinus.current = [] as CalendarItem[];
    setCalendarViewPlus([] as CalendarItem[]);
    setCalendarViewMinus([] as CalendarItem[]);
    // setTimelineWidth(0); // убираю лишний рендер
    scaleRestart.current = true;

    // реализуем ленивую загрузку
    // генерим стартовый день, но сначала проверим чтоб не задвоить его случайно
    if (!calendarPlus.current.find(elem => elem.idDay === idDay(today))) {
      calendarPlus.current = [...calendarPlus.current, generateCalendarItem(today, schedule)];
    }
    //  прорисовываем шкалу планирования
    // и убираем все что меньше текущей даты если случайно попали на смену дат
    const filteredCalendar = calendarPlus.current.filter(item => item.date >= today);
    setCalendarViewPlus(filteredCalendar);
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
    timelineWidth: number
  ): number => {
    const focusPointPx = timelineWidth / 2;
    const dayIndexAtFocus = (focusPointPx - oldShift) / oldDayWidth;
    return Math.round(focusPointPx - dayIndexAtFocus * newDayWidth);
  };

  const updateSize = () => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    const newTimelineWidth = rect.width;
    const newDayWidth = calculateWidthDay(newTimelineWidth, scale);

    // Пересчёт shift, только если размеры уже есть
    if (timelineWidth > 0 && dayWidth > 0 && dayWidth !== newDayWidth) {
      const newShift = computeDynamicShift(shift, dayWidth, newDayWidth, newTimelineWidth);
      setShift(newShift);
    }

    setTimelineWidth(newTimelineWidth);
    setDayWidth(newDayWidth);
  };

  // хук отслеживания изменеия размера видимой части шкалы
  useResizeObserver(divRef, () => {
    // твой пересчёт при изменении размеров контейнера
    updateSize();
  }, 200); // дебаунс 300мс

  let stopCloseMenuload = 0;
  let stopCloseMenuUnit = 0;

  // изменение при смене массива загрузки, может прорисоватся и при сохранении и при накидывании драфта
  useEffect(() => {
    //  получаем  планировку юнитов
    // Из загрузки вытаскиваем список юнитов и делим его на свой чужой;
    unitsViewInner.current = units.filter(elem => elem.belong === UnitBelongEnum.inner);
    unitsViewOuter.current = units.filter(elem => elem.belong === UnitBelongEnum.outer);

    // Стартовый масштаб всегда 100% и в нем помещается один день  
    // реализуем ленивую загрузку   
    // генерим стартовый день, но сначала проверим чтоб не задвоить его случайно    
    if (!calendarPlus.current.find(elem => elem.idDay === idDay(today))) {
      calendarPlus.current = [...calendarPlus.current, generateCalendarItem(today, schedule)];
    }

    //  прорисовываем шкалу планирования
    // и убираем все что меньше текущей даты если случайно попали на смену дат
    const filteredCalendar = calendarPlus.current.filter(item => item.date >= today);
    setCalendarViewPlus(filteredCalendar);

  }, [unitLoads]);


  // Обработка визуализации сдвига при изменении шкалы  и сдвига от левого края
  useEffect(() => {
    // scaleRestart.current = false;
    if (timelineWidth === 0) return

    // Вычисляем ширину дня при изменении scale
    const _dayWidth = calculateWidthDay(timelineWidth, scale)
    setDayWidth(calculateWidthDay(timelineWidth, scale)) // //padding 20 с обоих сторон уже учтен в timelineWidth

    // Вычисляем видимые элементы  беру сегодня как стартовую дату
    visibleItemsPlus.current = calculateVisibleItemsPlus(new Date(today), timelineWidth, _dayWidth, shift)

    // Вычисляем видимые элементы  в прошлое беру сегодня как финишную дату, отсчет обратный  
    visibleItemsMinus.current = calculateVisibleItemsMinus(new Date(today), timelineWidth, _dayWidth, shift)

    //  прорисовываем шкалу планирования
    // и убираем все что меньше текущей даты если случайно попали на смену дат
    const filteredCalendar = calendarPlus.current.filter(item => item.date >= today);
    setCalendarViewPlus(filteredCalendar);

    //  прорисовываем шкалу истории
    setCalendarViewMinus(calendarMinus.current);
    // // 🔧 Важное добавление — "касание" unitLoads
    // console.log("unitLoads length:", unitLoads.length);

    // }, [timelineWidth, shift, todayDateRef, scaleRestart.current]);  // Пересчитываем при изменении размераб сдвига, даты или масштаба
  }, [timelineWidth, shift, todayDateRef]);  // Пересчитываем при изменении размераб сдвига, даты или масштаба
  // timelineWidth-изменение размеров экрана
  //shift  -сдвиг временной шкалы
  //scale  - изменение масштаба
  //todayDateRef  - изменение текущей даты
  //scaleRestart.current  - принудительный рестарт


  const calculateVisibleItemsPlus = (startDay: Date, timelineWidth: number, dayWidth: number, shift: number) => {
    // если shift>0 тоэто сдвиг вперед
    // если shift<0 тоэто сдвиг назад

    // // начало отсчета дней от today
    // const starttimeline = shift;
    // видимые координаты на шкале
    const visibleleft = shift > 0 ? 0 : - shift;
    const visibleright = timelineWidth - shift

    // console.log('✅ left', visibleleft);
    // console.log('✅ right', visibleright);


    const _visibleItems = [] as string[] // ID дней которые видны
    // определяем оставшуюся шкалу с учетом сдвига от сегодня
    //  если был положительный сдвиг она уменьшится а если отрицательный увеличится 
    // дни надо сгенерить на всю шкалу

    let _timelineWidth = timelineWidth - shift;
    // console.log('✅ _timelineWidth', _timelineWidth);
    const _day = startDay; // временная переменная для дней  буду ее инкрементировать
    let countDay = 0;

    while (_timelineWidth > 0) {

      // Если этот день входит в дополнительные часы работы (isAdditionalTime) то проверку на выходной пропускаем
      //  его по любому надо рисовать в шкале

      // если  день приходится на выходные  и в настройках указано что мы скрываем выходные
      // крутим до первого буднего дня
      while (!settings.showWeekend && isWeekend(_day, schedule) && !isAdditionalTime(_day, schedule)) {
        _day.setDate(_day.getDate() + 1);
      }
      // если  день приходится на праздники  и в настройках указано что мы скрываем праздники
      // крутим до первого буднего дня
      while (!settings.showHoliday && isHoliday(_day, schedule) && !isAdditionalTime(_day, schedule)) {
        _day.setDate(_day.getDate() + 1);
      }

      // уменьшаем ширину на ширину дня
      _timelineWidth = _timelineWidth - dayWidth



      // обрабатываем только в том случае если день попадает в видимый диапазон       
      if (_timelineWidth + shift > timelineWidth) {
        _day.setDate(_day.getDate() + 1);
        continue
      }

      const id_day = idDay(_day);

      if (!calendarPlus.current.find(elem => elem.idDay === id_day)) {
        calendarPlus.current = [...calendarPlus.current, generateCalendarItem(_day, schedule)];
      }

      // координаты дня  на временной шкале
      const dayLeft = dayWidth * countDay;
      countDay++;
      const dayRight = dayWidth * countDay;

      // console.log('✅ dayLeft', dayLeft, countDay);
      // console.log('✅ dayRight', dayRight, countDay);

      if (dayRight > visibleleft && dayLeft < visibleright) {
        if (!_visibleItems.find(elem => elem === id_day)) {
          _visibleItems.push(id_day)
        }

      }

      // Добавляем один день
      _day.setDate(_day.getDate() + 1);

    }
    // setVisibleItems(_visibleItems)
    calendarPlus.current.sort((a, b) => a.date.getTime() - b.date.getTime());
    // console.log('✅ _visibleItems', _visibleItems);
    return _visibleItems;
  };

  const calculateVisibleItemsMinus = (startDay: Date, timelineWidth: number, dayWidth: number, shift: number) => {
    // если shift>0 тоэто сдвиг вперед
    // если shift<0 тоэто сдвиг назад

    // видимые координаты на шкале
    const visibleleft = 0 - shift;
    const visibleright = (shift > timelineWidth) ? -(shift - timelineWidth) : 0;

    // console.log('✅ visibleleft', visibleleft);
    // console.log('✅ visibleright', visibleright);

    const _visibleItems = [] as string[] // ID дней которые видны

    let countDay = 0;
    // если сдвиг положительный то нужно отстроить дни в прошлое
    //  буду сдвиг отсчитывать от сегодня
    if (shift >= 0) {
      let _shift = shift; // сдвег в прошлое     
      const _dayPast = new Date(startDay); // временная переменная для дней  буду ее инкрементировать  
      _dayPast.setDate(today.getDate() - 1);

      while (_shift > 0) {

        // если  день приходится на выходные  и в настройках указано что мы скрываем выходные и нет доп часов
        // крутим до первого буднего дня
        while (!settings.showWeekend && isWeekend(_dayPast, schedule) && !isAdditionalTime(_dayPast, schedule)) {
          _dayPast.setDate(_dayPast.getDate() - 1);
        }
        // если  день приходится на праздники  и в настройках указано что мы скрываем праздники и нет доп часов
        // крутим до первого буднего дня
        while (!settings.showHoliday && isHoliday(_dayPast, schedule) && !isAdditionalTime(_dayPast, schedule)) {
          _dayPast.setDate(_dayPast.getDate() - 1);
        }

        const id_day = idDay(_dayPast); //  сгенерили
        if (!calendarMinus.current.find(elem => elem.idDay === id_day)) {
          //  если его нет добавили в массив
          calendarMinus.current = [...calendarMinus.current, generateCalendarItem(_dayPast, schedule)];
        }

        _shift = _shift - dayWidth; // инкрементировали сдвиг

        // координаты дня  на временной шкале
        const dayRight = dayWidth * countDay;;
        countDay++;
        const dayLeft = -(dayWidth * countDay)

        // console.log('✅ dayLeft', dayLeft, countDay);
        // console.log('✅ dayRight', dayRight, countDay);

        if (dayRight > visibleleft && dayLeft < visibleright) {
          if (!_visibleItems.find(elem => elem === id_day)) {
            _visibleItems.push(id_day)
          }

        }

        _dayPast.setDate(_dayPast.getDate() - 1) // от сегодня сдвинули в прошлое день
      }
    }

    calendarMinus.current.sort((a, b) => a.date.getTime() - b.date.getTime());
    // console.log('✅ _visibleItems', _visibleItems);
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

  // Хендлер для отпускания операции(лоада) на шкалу и предварительное  планирование
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

    // 🧩 Если тащим саму операцию, смещаем влево на toUnitView.retool
    const retoolDurationPx = !isDraggingRetul && toUnitView.retool
      ? toUnitView.retool * pxPerMinute
      : 0;

    const adjustedOffset = dragOffsetX.current + retoolDurationPx;

    const leftEdgeX = event.clientX - adjustedOffset;
    const relativeX = leftEdgeX - containerRect.left + divRefPlus.current.scrollLeft;

    // 🧩 3. Определим день
    const dayIndex = Math.floor(relativeX / fullDayWidth);
    const calendarItem = calendarViewPlus[dayIndex];
    if (!calendarItem) {
      setIsLoadingDrop(NaN);
      return
    };

    const dayLeft = dayIndex * fullDayWidth;
    const offsetWithinDay = relativeX - dayLeft;

    const quantWidth = fullDayWidth / quants;
    const quantIndex = Math.floor(offsetWithinDay / quantWidth);
    const timeStart = (startQuant + quantIndex) * 5;
    const timeFinish = timeStart + 5;

    // 🧩 4. Перемещаем
    await moveLoadHandler(
      draggingLoad,
      toUnitView,
      calendarItem.date.toLocaleDateString("en-CA"),
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
  const handleMouseDownScale = (e: React.MouseEvent) => {
    // Нажата правая кнопка мыши 2 - тащим шкалу
    // Нажата правая кнопка мыши 0 - тащим операцию на шкале
    if (e.button !== 2) return

    setIsDraggingScale(true); // Включаем перетаскивание
    let isDragging_ = true; // Включаем перетаскивание
    const startX = e.clientX; // Сохраняем начальную позицию мыши X
    const startShift = shift; // Сохраняем начальный сдвиг 

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging_) {
        const diff = moveEvent.clientX - startX; // Разница в позиции
        const newShift = startShift + diff; // Новый сдвиг на основе разницы        
        setShift(newShift); // Сохраняем новый сдвиг        
      }
    };

    const onMouseUp = () => {
      isDragging_ = false; // Завершаем перетаскивание
      setIsDraggingScale(false); // Завершаем перетаскивание
      window.removeEventListener('mousemove', onMouseMove); // Убираем обработчики
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove); // Обработчик перемещения мыши
    window.addEventListener('mouseup', onMouseUp); // Обработчик отпускания кнопки мыши

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

      const hourStyleFoo = (scale: number, hours: number, minutes: number): { hourStyle: string, hoursValue: string, minutesValue: string } => {
        // // Вычисление высоты интервалов в зависимости от масштаба
        const show5Min = scale >= 200;  // Показывать интервал 5 минут, если масштаб >= 200%
        const show30Min = scale >= 80;  // Показывать интервал 30 минут, если масштаб >= 80%
        const show1Hour = scale >= 30; // Показывать часовые интервалы, если масштаб >= 30%
        const show4Hour = scale < 30; // Показывать интервалы для 4 часов, если масштаб <30%

        {/* Визуализация интервалов */ }

        if (show4Hour && [0, 4, 8, 12, 16, 20].includes(hours) && minutes === 0)  // 4 часа
          return {
            hourStyle: styles.interval4hours,
            hoursValue: String(hours),
            minutesValue: ""
          }
        else if (show1Hour && minutes === 0)
          return {
            hourStyle: [0, 4, 8, 12, 16, 20].includes(hours) ? styles.interval4hours : styles.interval1hour,
            hoursValue: String(hours),
            minutesValue: ""
          }
        else if (show30Min && [30].includes(minutes))
          return {
            hourStyle: styles.interval30min,
            hoursValue: "",
            minutesValue: ""
          }
        else if (show5Min && [0, 5, 10, 15, 20, 25, 35, 40, 45, 50, 55].includes(minutes))
          return {
            hourStyle: styles.interval5min,
            hoursValue: "",
            minutesValue: ""
          }
        else return { hourStyle: "", hoursValue: "", minutesValue: "" }

      }

      const { hourStyle, hoursValue, minutesValue } = hourStyleFoo(scale, hours, minutes)

      //  вычисление визуализации загруза юнитов
      // Внутренние   
      // console.log("Внутренние")
      const unitLoadBlockseReactNodesInner = unitsViewInner.current.map(unitView => {
        // console.log("unit", unitView)
        let unit_unloadEx = "";
        const exs = unitExceptions.filter(ex => ex.unitId === unitView.id && ex.date === calendarItem.date.toLocaleDateString("en-CA"));

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

          // console.log("unit_unloadEx", unit_unloadEx);

        }
        // unitLoads.filter(lo=>lo.idc_oper===52)

        const dateLoad = unitLoads.filter(lo => {
          return (lo.unit.id === unitView.id &&
            lo.date === new Date(calendarItem.date).toLocaleDateString("en-CA"))
        });
        // console.log("render2", dateLoad)
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
              // moveLoadHandler={moveLoadHandler}
              pinLoadHandler={pinLoadHandler}
              unPinLoadHandler={unPinLoadHandler}
              isLoadingDrop={isLoadingDrop === load.version && !load.isRetool}
            />
          })



          // Это прорисовка загрузок 
          return (<div key={unitView.id}
            onDragOver={e => e.preventDefault()} // Чтобы разрешить drop
            // onDrop={e => handleDropOper(e, unitView, i, calendarItem, isWorkTime, isBreakTime)}
            onDrop={e => handleDropOper(e, unitView)}
            className={`${styles.unit_unload} ${unit_unloadEx}`}>{operBlocksReactNodes}</div>)
        }
        // Это пустые сюда кидаем
        return (<div key={unitView.id}
          onDragOver={e => e.preventDefault()} // Чтобы разрешить drop
          // onDrop={e => handleDropOper(e, unitView, i, calendarItem, isWorkTime, isBreakTime)}
          onDrop={e => handleDropOper(e, unitView)}
          className={`${styles.unit_unload} ${unit_unloadEx}`}></div>); // Если нет совпадений
      });

      //  внешние
      // console.log("внешние", unitsViewOuter.current)
      const unitLoadBlockseReactNodesOuter = unitsViewOuter.current.map(unitView => {
        const dateLoad = unitLoads.filter(elem => {
          return (
            // ВРЕМЕННО для настройки внешнего лоада
            elem.unit.id === unitView.id &&
            new Date(elem.date).toDateString() === new Date(calendarItem.date).toDateString())
        });
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
            // onDrop={e => handleDropOper(e, unitView, i, calendarItem, isWorkTime, isBreakTime)}
            onDrop={e => handleDropOper(e, unitView)}
            className={styles.unit_unload}>{operBlocksReactNodes}</div>)
        }
        return (<div key={unitView.id}
          onDragOver={e => e.preventDefault()} // Чтобы разрешить drop
          // onDrop={e => handleDropOper(e, unitView, i, calendarItem, isWorkTime, isBreakTime)}
          onDrop={e => handleDropOper(e, unitView)}
          className={styles.unit_unload}></div>); // Если нет совпадений
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
    // console.log("render день плюс", elem.date);
    const isVisible = visibleItemsPlus.current.includes(elem.idDay);
    const hoursScaleReactNodes = isVisible ? generateTimeScalePlan(elem) : <div style={{ width: `${dayWidth}px` }} />;

    return (
      <div
        className={styles.day_scale}
        style={{ width: `${dayWidth}px` }} key={`day-${index}`}>

        {(scale > 0) && <span className={styles.day_title}>{elem.idDay}</span>}

        {/* // это красная риска сегодня начало дня  */}
        {today.getTime() === elem.date.getTime() && <div className={styles.today_scale}></div>}

        <div className={styles.time_container}>
          {hoursScaleReactNodes}
        </div>
      </div>
    )
  });

  const linesPlus = createLines("Plus", today.toLocaleDateString("en-CA"), unitLoads)
  const linesPlusReactNodes = linesPlus.map((elem, index) => {
    return <DottedLine key={index} startId={elem.startId} endId={elem.endId} container={divRefPlus.current} index={index} />
  })
  const linesMinus = createLines("Minus", today.toLocaleDateString("en-CA"), unitLoads)
  const linesMinusReactNodes = linesMinus.map((elem, index) => {
    return <DottedLine key={index} startId={elem.startId} endId={elem.endId} container={divRefMinus.current} index={index} />
  })

  const unitsReactNodesInner = unitsViewInner.current.map(elem => {
    return (
      <div key={elem.id} className={styles.unit_name} onClick={(event) => handletClickUnit(event, elem.idc)}> {elem.title}
       {unitMenuShow === elem.idc && ( <UnitMenu unitActions={unitActions.filter(a=>a.unitId===elem.id)}/>)}
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
              min="30"
              max="500"
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



