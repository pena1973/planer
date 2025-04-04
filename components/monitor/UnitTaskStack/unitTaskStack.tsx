
import React, { useEffect, useState, useRef } from 'react';
import styles from "./unitTaskStack.module.scss";
import { CalendarItem, UnitLoadItem, UnitBelongEnum, UnitExceptionItem, UnitItem, SettingsItem, ScheduleItem, DaysOfWeek, TCardItem, TimeTypeEnum } from "@/types";
import LoadMonitor from "./LoadMonitor/loadMonitor";

//  функция определяемт входит ли  дата в список дат дополнительного времени работы
const isAdditionalTime = (date: Date, schedule: ScheduleItem): boolean => {

  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  return schedule.workdays.some(workday =>
    new Date(workday.date).toLocaleDateString('en-CA').split(',')[0] === dateString
  );
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
  return schedule.weekends.includes(dayString);
}
//  функция определяемт входит ли  дата в список праздниклв расписания
const isHoliday = (date: Date, schedule: ScheduleItem): boolean => {
  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  return schedule.holidays.some(holiday =>
    new Date(holiday).toLocaleDateString('en-CA').split(',')[0] === dateString
  );
}

// генерация привычной нам даты - ее использую как id дня
const idDay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');  // День с ведущим нулем
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Месяц с ведущим нулем
  const year = date.getFullYear();  // Год

  return `${day}.${month}.${year}`;  // Возвращаем строку в формате "день.месяц.год"
};
// генерация одного дня на шкале
const generateCalendarItem = (day: string, schedule: ScheduleItem): CalendarItem => {
  const currentDate = new Date(day);  // Используем переданную дату для генерации одного элемента
  currentDate.setHours(0, 0, 0, 0);

  const _isWeekend = isWeekend(currentDate, schedule);  // День недели для учета выходных
  const _isHoliday = isHoliday(currentDate, schedule);  // День недели для учета Праздников
  const _isAdditionalTime = isAdditionalTime(currentDate, schedule);  // День недели для учета Праздников

  let timeStartWork = _isWeekend || _isHoliday ? 0 : schedule.timeStartWork;
  let timeFinishWork = _isWeekend || _isHoliday ? 0 : schedule.timeFinishWork;
  let breaks = _isWeekend || _isHoliday ? [] : [...schedule.breaks];

  if (_isAdditionalTime) {
    const workday = schedule.workdays.find(
      workday => workday.date === currentDate.toLocaleDateString("en-CA").split(',')[0]);
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
    date: new Date(currentDate),  // Текущая дата
    mounth: currentDate.getDate() === 1,  // Если это первый день месяца, ставим true
    day: true,  // Указываем, что это день
    timeStartWork: timeStartWork,  // Время начала работы (если не выходной)
    timeFinishWork: timeFinishWork,  // Время окончания работы (если не выходной)
    breaks: breaks,
  };
  return calendarItem;  // Возвращаем один элемент календаря
};

function isStartOfHour(intervTime: number): boolean {
  return intervTime % 60 === 0;
}

function formatIntervTime(intervTime: number): string {
  const hours = Math.floor(intervTime / 60);
  const minutes = intervTime % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
interface UnitTaskStackProps {
  unit: UnitItem,
  day: string; // "YYYY-MM-DD", например, текущая дата
  unitLoads: UnitLoadItem[]; // для именно этого юнита и этой даты
  settings: SettingsItem,
  schedule: ScheduleItem,
  unitExceptions: UnitExceptionItem[],
  containerHeight?: number; // высота контейнера в пикселях, например, 600
}

const UnitTaskStack: React.FC<UnitTaskStackProps> = ({
  unit,
  day,
  unitLoads,
  settings,
  schedule,
  unitExceptions,
  containerHeight = 600
}) => {
  // Определяем, что день начинается в 0 и заканчивается в 1440 минут (24 часа)
  const [calendarView, setCalendarView] = useState(generateCalendarItem(day, schedule) as CalendarItem);

  let hoursScaleReactNodes = [] as JSX.Element[];

  // время начала работы
  const dayStart = settings.timeStartWork // 0 - 1440  // время окончания работы
  // время окончания работы
  const dayEnd = settings.timeFinishWork // 0 - 1440

  // вычислим высоту интервала в 5 мин
  const intervalHeight = containerHeight / ((dayEnd - dayStart) / 5); // x интервалов по 5 минут в дне

  useEffect(() => {
    const calendarView_ = generateCalendarItem(day, schedule);
    setCalendarView(calendarView_);

  }, [day, schedule])


  // Функция для генерации шкалы времени  и загруза юнитов для одного дня
  const generateTimeScale = (calendarItem: CalendarItem): JSX.Element[] => {
    let intervalsReactNodes = [] as JSX.Element[];
    let dayScale = [] as JSX.Element[];

    let quants = 288;  // 288 5 минуток в дне (24 часа * 60/5 минут)  если показывать полные сутки
    let startQuant = 0;
    let finishQuant = 288;

    // Если в настройках указано иное
    if (settings.timeFinishWork > 0 || settings.timeStartWork > 0) {
      startQuant = settings.timeStartWork / 5;
      quants = settings.timeFinishWork / 5 - startQuant;
      finishQuant = settings.timeFinishWork / 5;
    }
    
    // let dateLoad = unitLoads.filter(elem => {
    //   return (elem.date === day)
    // });

    for (let i = startQuant; i < finishQuant; i++) {
      const intervTime = i * 5;
      const isWorkTime = intervTime >= calendarItem.timeStartWork && intervTime < calendarItem.timeFinishWork;
      const isBreakTime = calendarItem.breaks.some(breakPeriod =>
        intervTime >= breakPeriod.timeStart && intervTime < breakPeriod.timeFinish
      );

      //  расписание предприятия
      let timeStyle = isBreakTime
        ? styles.breakTime  // Если время перерыв, применяем стиль для перерыва
        : isWorkTime
          ? styles.workTime  // Если это рабочее время, применяем стиль для рабочего времени
          : styles.nonWorkTime;  // Если не рабочее и не перерыв, применяем стиль для не рабочего времени

      //  вычисление визуализации загруза юнита    
      let unit_unloadEx = "";
      let exs = unitExceptions.filter(ex => ex.unitId === unit.id && ex.date === calendarItem.date.toLocaleDateString("en-CA"));

      if (exs.length > 0) {
        // Если есть исключения устанавливатся новое время работы  индивидуально юниту
        // в этом случае оно заменяет общее расписание (Type Work)
        //  также устанавливаютсядругие перерывы на эту дату если изменилось время работы
        // либо может быть установлено не работа

        let exNotWork = exs.find(ex =>
          ex.type === TimeTypeEnum.notWork && intervTime >= ex.timeStart && intervTime < ex.timeFinish)
        if (exNotWork) unit_unloadEx = styles.nonWorkTime

        let exWork = exs.find(ex => ex.type === TimeTypeEnum.work)
        if (exWork) { unit_unloadEx = (intervTime >= exWork.timeStart && intervTime < exWork.timeFinish) ? styles.workTime : styles.nonWorkTime }

        let exBreack = exs.filter(ex => ex.type === TimeTypeEnum.breack)
        const isBreakTimeEx = exBreack.some(breakPeriod =>
          intervTime >= breakPeriod.timeStart && intervTime < breakPeriod.timeFinish
        );
        unit_unloadEx = isBreakTimeEx ? styles.breakTime : unit_unloadEx

      }
      let operBlocksReactNodes = [] as JSX.Element[];
      if (unitLoads.length > 0) {
        // ищем позиции которые начинаются а этом интервале
        const operBlocks = unitLoads.filter(load => {
          return intervTime <= load.timeStart && load.timeStart < (intervTime + 5);
        });

        // Расставляем блоки интервалов на шкале
         operBlocksReactNodes = operBlocks.map((load, index) => {
          return <LoadMonitor
            // dayWidth={dayWidth}
            // quants={quants}
            // intervTime={intervTime}
            load={load}
            // tCardLighted={tCardLighted}
            // tCards={tCards}
            // draggingLoad={draggingLoad}
            // contectMenuShow={contectMenuShow}
            // unitView={unitView}
            // erazLoadHandler={erazLoadHandler}
            // handleMouseDownOper={handleMouseDownOper}
            // handleMouseUpOper={handleMouseUpOper}
            // handleRightClickMenu={handleRightClickMenu}
            index={index}
            // moveLoadHandler={moveLoadHandler}
            // pinLoadHandler={pinLoadHandler}
            // unPinLoadHandler={unPinLoadHandler}
          />
        })

        // // Это прорисовка загрузок 
        // intervalsReactNodes.push(
        //   <div
        //     className={`${styles.unit_unload} ${unit_unloadEx} ${timeStyle} `}
        //     style={{ height: intervalHeight }}>
        //     {isStartOfHour(intervTime) && <div className={styles.timeLabel}>
        //       {formatIntervTime(intervTime)}
        //     </div>}
        //      {operBlocksReactNodes}
        //   </div> as JSX.Element)
      }

      //  
      // Это пустые сюда кидаем
      intervalsReactNodes.push(
        <div
          className={`${styles.unit_unload} ${unit_unloadEx} ${timeStyle} `}
          style={{ height: intervalHeight }}>
          {isStartOfHour(intervTime) && <div className={styles.timeLabel}>
            {formatIntervTime(intervTime)}
          </div>}
          {operBlocksReactNodes}
        </div> as JSX.Element)
    }
    //  );


    //   dayScale.push(
    //     <div
    //       key={`${calendarItem.day}+${i}}`}
    //       className={`${styles.timeBlock} ${timeStyle} ${hourStyle}`}
    //     // style={{ width: `${dayWidth / quants}px` }} // Делаем каждый блок 1/288 ширины
    //     >

    //       <div className={styles.timeLabel}>
    //         {hoursValue}
    //         {minutesValue}
    //       </div>
    //       {/* загрузка своих Юнитов */}
    //       <div className={styles.unit_gap} ></div>
    //       {/* {unitLoadBlockseReactNodesInner} */}
    //       {/* загрузка сторонних юнитов */}
    //       <div className={styles.unit_gap} ></div>

    //     </div>
    //   );
    //}
    //  return dayScale;
    return intervalsReactNodes as JSX.Element[];
  };

  hoursScaleReactNodes = generateTimeScale(calendarView);

  return (
    <div className={styles.container}
      style={{ minHeight: `${containerHeight}px` }} >
      <div className={styles.title_container}>
        <div className={styles.title}>{unit.title}</div>
        <div className={styles.title}>{day}</div>
      </div>

      <div className={styles.time_container}>
        {hoursScaleReactNodes}
      </div>


      {/* {unitLoads.map((load, index) => {
        const { effectiveStart, effectiveFinish } = getEffectiveTimes(load);
        // Вычисляем позицию относительно высоты контейнера
        const top = (effectiveStart / dayEnd) * containerHeight;
        const height = ((effectiveFinish - effectiveStart) / dayEnd) * containerHeight;

        return (
          <div className={styles.container}
            key={index}
            style={{
            //   position: 'absolute',
              top: `${top}px`,
              height: `${height}px`,
            //   left: '0',
            //   right: '0',
            //   backgroundColor: 'rgba(0, 150, 255, 0.3)',
            //   border: '1px solid #0096ff',
            //   boxSizing: 'border-box',
            //   padding: '2px',
            //   overflow: 'hidden',
            //   width:'200 px'
            }}
          >
            <div><strong>Операция:</strong> {load.id_oper}</div>
            <div>
              <small>
                {load.date} {load.timeStart} - {load.timeFinish}
              </small>
            </div>
          </div>
        );
      })} */}
      <div className={styles.title_container}>
        <div className={styles.title}>Выполнено</div>
        <div className={styles.title}>10%</div>
      </div>
    </div>
  );
};

export default UnitTaskStack;
