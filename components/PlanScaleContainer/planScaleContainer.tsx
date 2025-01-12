
import React, { useEffect, useState, useMemo, useRef } from 'react';
import styles from "./planScaleContainer.module.scss";
import { CalendarItem, LoadItem, DateLoadItem, UnitLoadItem, UnitBelongEnum, UnitTypeEnum, UnitItem } from "@/types";
import { setUnits } from '@/store/slices';

// генерация одного дня на шкале
const generateCalendarItem = (day: Date): CalendarItem => {
  const currentDate = new Date(day);  // Используем переданную дату для генерации одного элемента
  currentDate.setHours(0, 0, 0, 0);

  const dayOfWeek = currentDate.getDay();  // День недели для учета выходных

  // Создаем объект CalendarItem
  const calendarItem: CalendarItem = {
    idDay: idDay(currentDate),
    date: new Date(currentDate),  // Текущая дата
    mounth: currentDate.getDate() === 1,  // Если это первый день месяца, ставим true
    day: true,  // Указываем, что это день
    timeStartWork: (dayOfWeek !== 0 && dayOfWeek !== 6) ? 540 : 0,  // Время начала работы (9:00, если не выходной)
    timeFinishWork: (dayOfWeek !== 0 && dayOfWeek !== 6) ? 1020 : 0,  // Время окончания работы (17:00, если не выходной)
    timeStartBreack1: (dayOfWeek !== 0 && dayOfWeek !== 6) ? 780 : 0,  // Перерыв 1 (13:00, если не выходной)
    timeFinishBreack1: (dayOfWeek !== 0 && dayOfWeek !== 6) ? 840 : 0,  // Перерыв 1 (14:00, если не выходной)
    timeStartBreack2: 0,  // Перерыв 2 (не используется в этой логике)
    timeFinishBreack2: 0,  // Перерыв 2 (не используется в этой логике)
    timeStartBreack3: 0,  // Перерыв 3 (не используется в этой логике)
    timeFinishBreack3: 0,  // Перерыв 3 (не используется в этой логике)
  };
  return calendarItem;  // Возвращаем один элемент календаря
};
// расчет ширины дня
const calculateWidthDay = (totalWidth: number, scale: number): number => {
  // Если scale 100%, widthDay = totalWidth
  // Если scale 10%, widthDay = totalWidth / 100
  return (totalWidth * scale) / 100;
};
// генерация привычной нам даты - ее использую как id дня
const idDay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');  // День с ведущим нулем
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Месяц с ведущим нулем
  const year = date.getFullYear();  // Год

  return `${day}.${month}.${year}`;  // Возвращаем строку в формате "день.месяц.год"
};


const PlanScaleContainer: React.FC = () => {

  const divRef = useRef<HTMLDivElement>(null);  // Ссылка на div контейнер в котором временная шкала  
  const [dayWidth, setDayWidth] = useState(0); // ширина дня на шкале
  const [shift, setShift] = useState(0); // Сдвиг шкалы от левого края и старт день сегодня
  let calendarPlus = useRef([] as CalendarItem[]); // хранение дней шкалы времени то что можно планировать
  let calendarMinus = useRef([] as CalendarItem[]); // хранение дней шкалы времени то что уже история
  const [calendarViewPlus, setCalendarViewPlus] = useState([] as CalendarItem[]); // [прорисовка шкалы времени планирование при изменении]
  const [calendarViewMinus, setCalendarViewMinus] = useState([] as CalendarItem[]); // [прорисовка шкалы времени история при изменении]
  const [timelineWidth, setTimelineWidth] = useState(0); //видимая ширина временной шкалы
  const [scale, setScale] = useState(500); // содержит Масштаб (10% - 500%)  
  const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания перетаскивания

  let unitsLoad = useRef([] as UnitLoadItem[]); // массив юнитов  
  let unitsViewInner = useRef([] as UnitItem[]); // Список заголовков юнитов наших
  let unitsViewOuter = useRef([] as UnitItem[]); // Список заголовков юнитов внешних оутсортеров

  let today = new Date();
  today.setHours(0, 0, 0, 0); // Устанавливаем начало дня (00:00:00.000)
  const todayDateRef = useRef(idDay(today));
  if (idDay(today) !== todayDateRef.current) {
    todayDateRef.current = idDay(today);
  }

  // Функция для изменения масштаба
  const handleScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {

    const newScale = Number(event.target.value);
    let newShift = shift * (newScale / scale);  // Пропорциональное изменение сдвига

    setScale(newScale);
    setShift(newShift);
  };
  // Функция для изменения масштаба
  const getUnits = () => {
    // mock
    // массив юнитов с загрузкой
    const units: UnitLoadItem[] = [
      {
        unit: {
          id: 1,
          title: " Артур",
          code: "12",
          actions: [],
          retool: 2000,
          modified: false,
          belong: UnitBelongEnum.I,
          type: UnitTypeEnum.P,
        },
        loads: [{
          date: new Date(2025, 0, 12, 0, 0, 0,),
          operations: [{
            idc_oper: 45,
            id_tCard: 33,
            msStart: 32400000, // начало интервала загрузки в ms от начала дня
            msFinish: 64800000 // конец интервала загрузки в ms от начала дня
          }, {
            idc_oper: 46,
            id_tCard: 37,
            msStart: 54800000,
            msFinish: 64800000
          }
          ]
        }, {
          date: new Date(2025, 0, 13, 0, 0, 0,),
          operations: [{
            idc_oper: 45,
            id_tCard: 33,
            msStart: 32400000,
            msFinish: 44800000
          }, {
            idc_oper: 46,
            id_tCard: 37,
            msStart: 54800000,
            msFinish: 64800000
          }
          ]
        }]
      },
      {
        unit: {
          id: 2,
          title: " Сергей",
          code: "11",
          actions: [],
          retool: 2000,
          modified: false,
          belong: UnitBelongEnum.I,
          type: UnitTypeEnum.P,
        },
        loads: [{
          date: new Date(2025, 0, 13, 0, 0, 0,),
          operations: [{
            idc_oper: 45,
            id_tCard: 33,
            msStart: 32400000,
            msFinish: 38400000
          }, {
            idc_oper: 46,
            id_tCard: 37,
            msStart: 48400000,
            msFinish: 64800000
          }
          ]
        }, {
          date: new Date(2025, 0, 12, 0, 0, 0,),
          operations: [{
            idc_oper: 45,
            id_tCard: 33,
            msStart: 32400000,
            msFinish: 38400000
          }, {
            idc_oper: 46,
            id_tCard: 37,
            msStart: 48400000,
            msFinish: 64800000
          }
          ]
        }]
      },
      {
        unit: {
          id: 3,
          title: " Хранилище",
          code: "15",
          actions: [],
          retool: 2000,
          modified: false,
          belong: UnitBelongEnum.I,
          type: UnitTypeEnum.K,
        },
        loads: []
      },
      {
        unit: {
          id: 10,
          title: " SIA Outer",
          code: "120",
          actions: [],
          retool: 2000,
          modified: false,
          belong: UnitBelongEnum.O,
          type: UnitTypeEnum.P,
        },
        loads: [{
          date: new Date(2025, 0, 12, 0, 0, 0,),
          operations: [{
            idc_oper: 45,
            id_tCard: 33,
            msStart: 32400000, // начало интервала загрузки в ms от начала дня
            msFinish: 64800000 // конец интервала загрузки в ms от начала дня
          }, {
            idc_oper: 46,
            id_tCard: 37,
            msStart: 54800000,
            msFinish: 64800000
          }
          ]
        }, {
          date: new Date(2025, 0, 13, 0, 0, 0,),
          operations: [{
            idc_oper: 45,
            id_tCard: 33,
            msStart: 32400000,
            msFinish: 44800000
          }, {
            idc_oper: 46,
            id_tCard: 37,
            msStart: 54800000,
            msFinish: 64800000
          }
          ]
        }]
      },
      {
        unit: {
          id: 20,
          title: " SIA Ontec",
          code: "11",
          actions: [],
          retool: 2000,
          modified: false,
          belong: UnitBelongEnum.O,
          type: UnitTypeEnum.P,
        },
        loads: [{
          date: new Date(2025, 0, 13, 0, 0, 0,),
          operations: [{
            idc_oper: 45,
            id_tCard: 33,
            msStart: 32400000,
            msFinish: 38400000
          }, {
            idc_oper: 46,
            id_tCard: 37,
            msStart: 48400000,
            msFinish: 64800000
          }
          ]
        }, {
          date: new Date(2025, 0, 12, 0, 0, 0,),
          operations: [{
            idc_oper: 45,
            id_tCard: 33,
            msStart: 32400000,
            msFinish: 38400000
          }, {
            idc_oper: 46,
            id_tCard: 37,
            msStart: 48400000,
            msFinish: 64800000
          }
          ]
        }]
      },
      {
        unit: {
          id: 30,
          title: " SIA Open Store",
          code: "15",
          actions: [],
          retool: 2000,
          modified: false,
          belong: UnitBelongEnum.O,
          type: UnitTypeEnum.K,
        },
        loads: []
      }

    ];
    return units
  };

  // Инициализация
  useEffect(() => {
    //  получаем  планировку юнитов
    unitsLoad.current = getUnits();
    let unitsView = unitsLoad.current.map(elem => { return elem.unit })
    unitsViewInner.current = unitsView.filter(elem => elem.belong === UnitBelongEnum.I);
    unitsViewOuter.current = unitsView.filter(elem => elem.belong === UnitBelongEnum.O);
    // Стартовый масштаб всегда 100% и в нем помещается один день  временно 500
    // реализуем ленивую загрузку
    // генерим стартовый день, но сначала проверим чтоб не задвоить его случайно
    if (!calendarPlus.current.find(elem => elem.idDay === idDay(today))) {
      calendarPlus.current = [...calendarPlus.current, generateCalendarItem(today)];
    }
    //  Исторические данные не показываем при начале работы
    // задаю размер контейнера
    const updateSize = () => {
      if (divRef.current) {
        const rect = divRef.current.getBoundingClientRect();
        setTimelineWidth(rect.width - 40); //учитываю padding 20 с обоих сторон
        setDayWidth(calculateWidthDay(rect.width - 40, scale))
      }
    };
    // Изначально проверяем размер
    updateSize();
    //  прорисовываем шкалу планирования
    // и убираем все что меньше текущей даты если случайно попали на смену дат
    const filteredCalendar = calendarPlus.current.filter(item => item.date >= today);
    setCalendarViewPlus(filteredCalendar);

    // Обновляем размеры при изменении размера окна
    window.addEventListener('resize', updateSize);
    // Убираем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('resize', updateSize);
    };

  }, []);

  // Обработка визуализации сдвига при изменении шкалы и размера окна и сдвига от левого края
  useEffect(() => {
    if (timelineWidth === 0) return
    // Вычисляем ширину дня при изменении scale
    const _dayWidth = calculateWidthDay(timelineWidth, scale)
    setDayWidth(calculateWidthDay(timelineWidth, scale)) // //padding 20 с обоих сторон уже учтен в timelineWidth

    // Вычисляем видимые элементы  беру сегодня как стартовую дату
    calculateVisibleItemsPlus(new Date(today), timelineWidth, _dayWidth, shift)

    // Вычисляем видимые элементы  в прошлое беру сегодня как финишную дату, отсчет обратный  
    calculateVisibleItemsMinus(new Date(today), timelineWidth, _dayWidth, shift)

    //  прорисовываем шкалу планирования
    // и убираем все что меньше текущей даты если случайно попали на смену дат
    const filteredCalendar = calendarPlus.current.filter(item => item.date >= today);
    setCalendarViewPlus(filteredCalendar);

    //  прорисовываем шкалу истории
    setCalendarViewMinus(calendarMinus.current);


  }, [timelineWidth, shift, scale, todayDateRef]);  // Пересчитываем при изменении размераб сдвига, даты или масштаба

  const calculateVisibleItemsPlus = (startDay: Date, timelineWidth: number, dayWidth: number, shift: number) => {
    // если shift>0 тоэто сдвиг вперед
    // если shift<0 тоэто сдвиг назад

    let _visibleItems = [] as string[] // ID дней которые видны

    // определяем оставшуюся шкалу с учетом сдвига от сегодня
    //  если был положительный сдвиг она уменьшится а если отрицательный увеличится 
    // дни надо сгенерить на всю шкалу
    let _timelineWidth = timelineWidth - shift;
    let _day = startDay; // временная переменная для дней  буду ее инкрементировать
    while (_timelineWidth > 0) {

      let id_day = idDay(_day);
      if (!calendarPlus.current.find(elem => elem.idDay === id_day)) {
        calendarPlus.current = [...calendarPlus.current, generateCalendarItem(_day)];
      }
      if (!_visibleItems.find(elem => elem === id_day)) {
        _visibleItems.push(id_day)
      }
      // Добавляем один день
      _day.setDate(_day.getDate() + 1);
      // уменьшаем ширину на ширину дня
      _timelineWidth = _timelineWidth - dayWidth
    }
    // setVisibleItems(_visibleItems)
    calendarPlus.current.sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  const calculateVisibleItemsMinus = (startDay: Date, timelineWidth: number, dayWidth: number, shift: number) => {
    // если shift>0 тоэто сдвиг вперед
    // если shift<0 тоэто сдвиг назад

    let _visibleItems = [] as string[] // ID дней которые видны

    // если сдвиг положительный то нужно отстроить дни в прошлое
    //  буду сдвиг отсчитывать от сегодня
    if (shift >= 0) {
      let _shift = shift; // сдвег в прошлое     
      let _dayPast = new Date(startDay); // временная переменная для дней  буду ее инкрементировать         
      while (_shift > 0) {
        _dayPast.setDate(_dayPast.getDate() - 1) // от сегодня сдвинули в прошлое день
        let id_day = idDay(_dayPast); //  сгенерили
        if (!calendarMinus.current.find(elem => elem.idDay === id_day)) {
          //  если его нет добавили в массив
          calendarMinus.current = [...calendarMinus.current, generateCalendarItem(_dayPast)];
        }
        // определили его видимость
        if (Math.abs(_shift) <= timelineWidth && !_visibleItems.find(elem => elem === id_day)) {
          _visibleItems.push(id_day)
        }
        _shift = _shift - dayWidth; // инкрементировали сдвиг
      }
    }

    calendarMinus.current.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Для перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true); // Включаем перетаскивание
    let isDragging_ = true; // Включаем перетаскивание
    const startX = e.clientX; // Сохраняем начальную позицию мыши
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
      setIsDragging(false); // Завершаем перетаскивание
      window.removeEventListener('mousemove', onMouseMove); // Убираем обработчики
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove); // Обработчик перемещения мыши
    window.addEventListener('mouseup', onMouseUp); // Обработчик отпускания кнопки мыши
  };

  // Функция для генерации шкалы времени  и загруза юнитов для одного дня
  const generateTimeScale = (calendarItem: CalendarItem) => {
    const dayScale = [];
    for (let i = 0; i < 288; i++) { // 288 5 минуток в дне (24 часа * 60/5 минут)
      const intervTime = i * 5;
      const isWorkTime = intervTime >= calendarItem.timeStartWork && intervTime < calendarItem.timeFinishWork;
      const isBreakTime = (
        (intervTime >= calendarItem.timeStartBreack1 && intervTime < calendarItem.timeFinishBreack1) ||
        (intervTime >= calendarItem.timeStartBreack2 && intervTime < calendarItem.timeFinishBreack2) ||
        (intervTime >= calendarItem.timeStartBreack3 && intervTime < calendarItem.timeFinishBreack3)
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
        const show1Hour = scale >= 50; // Показывать часовые интервалы, если масштаб >= 30%
        const show4Hour = scale < 50; // Показывать интервалы для 4 часов, если масштаб <30%

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
      // Проверяем загрузку юнитов


      let unitLoadBlockseReactNodesInner = unitsViewInner.current.map(unitView => {
        let unitLoad = unitsLoad.current.find(elem => elem.unit.id === unitView.id);
        if (!unitLoad) return (<div className={styles.unit_unload} >1</div>);
        // Ищем загрузки юнитов для конкретной даты
        const dateLoad = unitLoad.loads.find(load =>
          load.date.toDateString() === calendarItem.date.toDateString()
        );

        if (dateLoad) {
          // Проверяем, попадает ли текущий интервал в загрузку этого юнита
          const isUnitLoaded = dateLoad.operations.some(operation => {

            return intervTime >= operation.msStart / (1000 * 60) && intervTime < operation.msFinish / (1000 * 60);
          });

          // Добавляем блок загрузки юнита, если интервал совпадает
          if (isUnitLoaded) {
            return (<div className={styles.unit_load} ></div>);
          }
          else return (<div className={styles.unit_unload} ></div>);

        }
        else return (<div className={styles.unit_unload} ></div>);
      });
      let unitLoadBlockseReactNodesOuter = unitsViewOuter.current.map(unitView => {
        let unitLoad = unitsLoad.current.find(elem => elem.unit.id === unitView.id);
        if (!unitLoad) return (<div className={styles.unit_unload} >1</div>);
        // Ищем загрузки юнитов для конкретной даты
        const dateLoad = unitLoad.loads.find(load =>
          load.date.toDateString() === calendarItem.date.toDateString()
        );

        if (dateLoad) {
          // Проверяем, попадает ли текущий интервал в загрузку этого юнита
          const isUnitLoaded = dateLoad.operations.some(operation => {

            return intervTime >= operation.msStart / (1000 * 60) && intervTime < operation.msFinish / (1000 * 60);
          });

          // Добавляем блок загрузки юнита, если интервал совпадает
          if (isUnitLoaded) {
            return (<div className={styles.unit_load} ></div>);
          }
          else return (<div className={styles.unit_unload} ></div>);

        }
        else return (<div className={styles.unit_unload} ></div>);
      });

      dayScale.push(
        <div
          key={i}
          className={`${styles.timeBlock} ${timeStyle} ${hourStyle}`}
          style={{ width: `${dayWidth / 288}px` }} // Делаем каждый блок 1/288 ширины
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


  let timeScaleReactNodesMinus = calendarViewMinus.map((elem, index) => {

    const hoursScaleReactNodes = generateTimeScale(elem)
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

  let timeScaleReactNodesPlus = calendarViewPlus.map((elem, index) => {

    const hoursScaleReactNodes = generateTimeScale(elem)
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

  let unitsReactNodesInner = unitsViewInner.current.map(elem => {
    return (
      <div key={elem.id} className={styles.unit_name}> {elem.title}</div>
    )
  });
  let unitsReactNodesOuter = unitsViewOuter.current.map(elem => {
    return (
      <div key={elem.id} className={styles.unit_name}> {elem.title}</div>
    )
  });
  return (
    <div ref={divRef} className={styles.plan_scale_container}>

      <div className={styles.plan_scale_container_right}>
        <div className={styles.plug}> </div>
        <div className={styles.units_title}> свои</div>
        {unitsReactNodesInner}
        <div className={styles.units_title}> сторонние</div>
        {unitsReactNodesOuter}
      </div>
      <div className={styles.plan_scale_container_left}>
        <div className={styles.header}>
          <div className={styles.scale_controls}>
            <input
              className={styles.rangeSlider}
              type="range"
              min="10"
              max="500"
              step="1"
              value={scale}
              onChange={handleScaleChange}
            />
            <label>Масштаб: {Math.round(scale)}%</label>

          </div>

        </div>
        <div className={styles.scale_container}>

          <div className={styles.timeline}
            style={{
              width: `${timelineWidth}px`,
              transform: `translateX(${shift}px)`, // Сдвиг шкалы по оси X  
              cursor: isDragging ? 'grabbing' : 'grab', // Меняем курсор в зависимости от состояния
            }}
            onMouseDown={handleMouseDown} // Добавляем обработчик нажатия мыши
          >

            {/* Сдвигаем элементы timeScaleReactNodesMinus на тот же сдвиг */}
            {/* Эти элементы идут перед основными */}
            <div style={{
              // backgroundColor: 'yellowgreen',
              height: '100%',
              display: 'flex',
              flexDirection: 'row',
              position: 'absolute',
              right: `${timelineWidth}px`,
            }}>
              {timeScaleReactNodesMinus}
            </div>

            {/* Основные элементы шкалы */}
            <div style={{
              // backgroundColor: 'yellow',
              height: '100%',
              display: 'flex',
              flexDirection: 'row',
              position: 'absolute',
              left: '0',
              width: 'fit-content'
            }}>
              {timeScaleReactNodesPlus}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};


export default PlanScaleContainer;
