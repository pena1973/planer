
import React, { useEffect, useState, useRef } from 'react';
import styles from "./unitTaskStackProcess.module.scss";
import { CalendarItem, UnitLoadItem, UnitExceptionItem, UnitItem, SettingsItem, ScheduleItem, DaysOfWeek, TCardItem, TimeTypeEnum, TCardOperationItem, StatusEnum } from "@/types";
import LoadMonitorProcess from "./LoadMonitorProcess/loadMonitorProcess";
import LoadOperProcess from "./LoadOperProcess/loadOperProcess";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { formatDate, padNumberToFourDigits, ISOStringToLocalDateTime } from "@/utils"

//  функция определяемт входит ли  дата в список дат дополнительного времени работы
const isAdditionalTime = (date: Date, schedule: ScheduleItem): boolean => {

  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  if (schedule.team)
    return schedule.workdays.some(workday =>
      new Date(workday.date).toLocaleDateString('en-CA').split(',')[0] === dateString
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

  if (schedule.team) return schedule.weekends.includes(dayString);
  else return false
}

//  функция определяемт входит ли  дата в список праздниклв расписания
const isHoliday = (date: Date, schedule: ScheduleItem): boolean => {
  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  if (schedule.team)
    return schedule.holidays.some(holiday =>
      new Date(holiday).toLocaleDateString('en-CA').split(',')[0] === dateString
    );
  else return false;
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
  let breaks = _isWeekend || _isHoliday || (!schedule.team) ? [] : [...schedule.breaks];

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
// Функция определяет что интервал в 5 минут является началом часа
function isStartOfHour(intervTime: number): boolean {
  return intervTime % 60 === 0;
}
// Функция для визуализации времени для юзера
function formatIntervTime(intervTime: number): string {
  const hours = Math.floor(intervTime / 60);
  const minutes = intervTime % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

interface UnitTaskStackProcessProps {
  unit: UnitItem,
  tCards: TCardItem[],
  day: string; // "YYYY-MM-DD", например, текущая дата
  unitLoads: UnitLoadItem[]; // для именно этого юнита и этой даты
  settings: SettingsItem,
  schedule: ScheduleItem,
  unitExceptions: UnitExceptionItem[],
  containerHeight?: number; // высота контейнера в пикселях, например, 600
  isQualControl?: boolean // существует отдельно контроль качества
  setMessage: (message: string) => void,
  getStartFinishOper: (load: UnitLoadItem) => {
    start: { date: string, time: number },
    finish: { date: string, time: number }
  },
  setStatusLoadsHandler: (status: StatusEnum, operloadsIds: number[]) => void
}

const UnitTaskStackProcess: React.FC<UnitTaskStackProcessProps> = ({
  unit,
  tCards,
  day,
  unitLoads,
  settings,
  schedule,
  unitExceptions,
  containerHeight = 600,
  isQualControl = false,
  setMessage,
  getStartFinishOper,
  setStatusLoadsHandler
}) => {
  // Определяем, что день начинается в 0 и заканчивается в 1440 минут (24 часа)
  const [calendarView, setCalendarView] = useState(generateCalendarItem(day, schedule) as CalendarItem);
  const [operView, setOperView] = useState(false);
  const [currentOper, setCurrentOper] = useState({} as TCardOperationItem);
  const [currentTCard, setCurrentTCard] = useState({} as TCardItem);
  const [currentLoad, setCurrentLoad] = useState({} as UnitLoadItem);
  const statistic = useRef({} as { workTime: number, busyTime: number, defectedTime: number, resultTime: number });

  let hoursScaleReactNodes = [] as JSX.Element[];

  // // время начала работы
  // const dayStart = settings.timeStartWork; // 0 - 1440  
  // // время окончания работы
  // const dayEnd = (settings.timeFinishWork === 0) ? 1440 : settings.timeFinishWork; // 0 - 1440  

  // // вычислим высоту интервала в 5 мин
  //  const intervalHeight = containerHeight / ((dayEnd - dayStart) / 5); // x интервалов по 5 минут в дне
  // let quants = 288;  // 288 5 минуток в дне (24 часа * 60/5 минут)  если показывать полные сутки
   //let startQuant = 0;
   //let finishQuant = 288;

  // Если в настройках указано иное
  // if (settings.timeFinishWork > 0 || settings.timeStartWork > 0) {
    // Округляем время начала работы до целого числа
   const startQuant = Math.floor(settings.timeStartWork / 5);
    // Если время завершения работы равно 0, присваиваем значение 1440
    const timeFinishWork = settings.timeFinishWork === 0 ? 1440 : settings.timeFinishWork;
    // Округляем время завершения работы до целого числа и добавляем 1
    const finishQuant = Math.ceil(timeFinishWork / 5);
    // Рассчитываем количество промежуточных значений
    const  quants = finishQuant - startQuant;
    const intervalHeight = containerHeight / ((finishQuant - startQuant) / 1); // x интервалов по 5 минут в дне
  // }



  useEffect(() => {
    const calendarView_ = generateCalendarItem(day, schedule);
    setCalendarView(calendarView_);
    setOperView(false);
    setCurrentOper({} as TCardOperationItem);
    setCurrentTCard({} as TCardItem);
    setCurrentLoad({} as UnitLoadItem);
  }, [day, schedule])

  // Открываем операцию по нажатию кенопки юнитом 
  const openOperHandler = async (load: UnitLoadItem, id_oper: number, id_tCard: number) => {
    setOperView(true);

    // получаем полную операцию и разворачиваем
    // Запрос на сервер

    try {
      const res = await fetch(`api/tcard-api1?userId=${1}&teamId=${1}&tCardId=${id_tCard}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        setMessage(receivedData.message);

        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)
        setMessage(receivedData.message);
        if (receivedData.success) {
          //   Обновим текущую карту
          let tCard = receivedData.tCard as TCardItem
          setCurrentTCard(tCard);
          const oper = tCard.tCardOperations?.find((oper) => oper.id === id_oper);
          if (!oper) return
          setCurrentOper(oper as TCardOperationItem);
          setCurrentLoad(load as UnitLoadItem);
          setMessage(receivedData.message);
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
  }
  // Закрываем операцию без изменения по нажатию кенопки юнитом 
  const closeOperHandler = (): void => {
    setOperView(false);
    setCurrentOper({} as TCardOperationItem);
    setCurrentTCard({} as TCardItem);
    setCurrentLoad({} as UnitLoadItem);

  }
  // Меняем статус операции по нажатию кенопки юнитом 
  const setOperStatusHandler = async (status: StatusEnum) => {
    setOperView(false);
    const operloadsIds = unitLoads
      .filter(lo => lo.id_oper === currentOper.id && lo.version === currentLoad.version && lo.status === StatusEnum.planed)
      .map(load => load.id as number); //  все лоады операции

    try {
      const res = await fetch(`api/tcard-oper-status-api?userId=${1}&teamId=${1}`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            operId: currentOper.id,
            loadsIds: operloadsIds,
            status: status
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        setMessage(receivedData.message);

        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)
        setMessage(receivedData.message);
        if (receivedData.success) {
          //   Обновим статус лоадов
          setStatusLoadsHandler(status, operloadsIds);
          setMessage(receivedData.message);
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

    setCurrentOper({} as TCardOperationItem);
    setCurrentTCard({} as TCardItem);
    setCurrentLoad({} as UnitLoadItem);
  }

  // Функция для генерации шкалы времени  и загруза юнитов для одного дня
  const generateTimeScale = (calendarItem: CalendarItem): JSX.Element[] => {
    let intervalsReactNodes = [] as JSX.Element[];
    let thisWorkinterval = false; //Этот интервал - это рабочее время в расписании юнита включая исключения
    let workTime = 0; // рабочее время в процентах
    let busyTime = 0; // Занятое задачами
    let defectedTime = 0; // время производства брака
    let resultTime = 0; // время производства результата

    const isFirstLoadForOperation = (load: UnitLoadItem, loads: UnitLoadItem[]): boolean => {
      // Если текущий load - ретул, то не считаем его
      if (load.isRetool) return false;

      // Отбираем все загрузки для той же операции, не являющиеся ретулом
      const relevantLoads = loads.filter(l => l.id_oper === load.id_oper && !l.isRetool);

      // Если их нет или это единственная, то текущий load - первый
      if (relevantLoads.length === 0) return false;

      // Находим загрузку с минимальным timeStart
      const firstLoad = relevantLoads.reduce((min, curr) => curr.timeStart < min.timeStart ? curr : min);

      // Сравниваем идентификаторы (или другие уникальные поля)
      return firstLoad.id === load.id;
    }
    let quants = 288;  // 288 5 минуток в дне (24 часа * 60/5 минут)  если показывать полные сутки
    let startQuant = 0;
    let finishQuant = 288;

    // Если в настройках указано иное
    // if (settings.timeFinishWork > 0 || settings.timeStartWork > 0) {
      // Округляем время начала работы до целого числа
      startQuant = Math.floor(settings.timeStartWork / 5);
      // Если время завершения работы равно 0, присваиваем значение 1440
      const timeFinishWork = settings.timeFinishWork === 0 ? 1440 : settings.timeFinishWork;
      // Округляем время завершения работы до целого числа и добавляем 1
      finishQuant = Math.ceil(timeFinishWork / 5);
      // Рассчитываем количество промежуточных значений
      quants = finishQuant - startQuant;
     
    // }

    for (let i = startQuant; i < finishQuant; i++) {
      const intervTime = i * 5;
      const isWorkTime = intervTime >= calendarItem.timeStartWork && intervTime < calendarItem.timeFinishWork;
      const isBreakTime = calendarItem.breaks.some(breakPeriod =>
        intervTime >= breakPeriod.timeStart && intervTime < breakPeriod.timeFinish
      );

      thisWorkinterval = isWorkTime && !isBreakTime

      //  расписание предприятия
      let timeStyle = isBreakTime
        ? styles.breakTime  // Если время перерыв, применяем стиль для перерыва
        : isWorkTime
          ? styles.workTime  // Если это рабочее время, применяем стиль для рабочего времени
          : styles.nonWorkTime;  // Если не рабочее и не перерыв, применяем стиль для не рабочего времени

      //  вычисление визуализации загруза юнита  с учетом исключений   
      let unit_unloadEx = "";
      let exs = unitExceptions.filter(ex => ex.unitId === unit.id && ex.date === calendarItem.date.toLocaleDateString("en-CA"));


      if (exs.length > 0) {
        // Если есть исключения устанавливатся новое время работы  индивидуально юниту
        // в этом случае оно заменяет общее расписание (Type Work)
        //  также устанавливаютсядругие перерывы на эту дату если изменилось время работы
        // либо может быть установлено не работа

        let exNotWork = exs.find(ex =>
          ex.type === TimeTypeEnum.notWork && intervTime >= ex.timeStart && intervTime < ex.timeFinish)
        if (exNotWork) {
          unit_unloadEx = styles.nonWorkTime;
          thisWorkinterval = false; //  не рабочий интервал
        }

        let exWork = exs.find(ex => ex.type === TimeTypeEnum.work)
        if (exWork) {
          unit_unloadEx = (intervTime >= exWork.timeStart && intervTime < exWork.timeFinish) ? styles.workTime : styles.nonWorkTime
          thisWorkinterval = (intervTime >= exWork.timeStart && intervTime < exWork.timeFinish); //  не рабочий интервал
        }

        let exBreack = exs.filter(ex => ex.type === TimeTypeEnum.breack)
        const isBreakTimeEx = exBreack.some(breakPeriod =>
          intervTime >= breakPeriod.timeStart && intervTime < breakPeriod.timeFinish
        );

        unit_unloadEx = isBreakTimeEx ? styles.breakTime : unit_unloadEx
        thisWorkinterval = isBreakTimeEx ? false : thisWorkinterval
      }

      workTime = workTime + ((thisWorkinterval) ? 5 : 0)

      let operBlocksReactNodes = [] as JSX.Element[];
      if (unitLoads.length > 0) {
        // ищем лоады которые начинаются а этом интервале
        const operBlocks = unitLoads.filter(load => {
          return intervTime <= load.timeStart && load.timeStart < (intervTime + 5) && !load.isRetool;
        });


        // Расставляем блоки интервалов на шкале
        operBlocksReactNodes = operBlocks.map((load, index) => {
          // подсчет статистики
          if (load.status !== StatusEnum.cancelled) {
            busyTime = busyTime + (load.timeFinish - load.timeStart)
          }
          if (load.status === StatusEnum.performed || load.status === StatusEnum.ready) {
            resultTime = resultTime + (load.timeFinish - load.timeStart)
          }

          if (load.status === StatusEnum.defective) {
            defectedTime = defectedTime + (load.timeFinish - load.timeStart)
          }

          const loadHeight = (load.timeFinish - load.timeStart) / 5 * intervalHeight
          let titleCard = "";
          const tCard = tCards.find(tCard => tCard.id === load.id_tCard); // ищем карточку          
          if (tCard)
            titleCard = `${padNumberToFourDigits(tCard.number)} - ${new Date(tCard.date).toLocaleDateString("en-CA")};`

          return <LoadMonitorProcess
            loadHeight={loadHeight}
            showTitle={isFirstLoadForOperation(load, unitLoads)}
            load={load}
            titleCard={titleCard}
            openOperHandler={openOperHandler}
            index={index}
          />
        })
      }

      //  
      // Это пустые сюда кидаем
      intervalsReactNodes.push(
        <div
          className={`${styles.unit_unload} ${unit_unloadEx} ${timeStyle} `}
          style={{ height: intervalHeight }}>
          {isStartOfHour(intervTime) && <div className={styles.timeLabel}>
            {formatIntervTime(intervTime)} 
              {/* 0 это начало 1 часа */}
          </div>}
          {operBlocksReactNodes}
        </div> as JSX.Element)
    }

    statistic.current = { workTime, busyTime, defectedTime, resultTime }
    return intervalsReactNodes as JSX.Element[];
  };

  hoursScaleReactNodes = generateTimeScale(calendarView);

  const terms = getStartFinishOper(currentLoad);

  // статистика работы юнита в этот день
  let work = statistic.current.workTime === 0 ? 0 : Math.round((statistic.current.busyTime / statistic.current.workTime) * 100);
  let result = 0;
  let defect = 0;
  if (statistic.current.busyTime !== 0) {
    result = Math.round((statistic.current.resultTime / statistic.current.busyTime) * 100);
    defect = Math.round((statistic.current.defectedTime / statistic.current.busyTime) * 100);
  }

  return (
    <div className={styles.container}
      style={{ minHeight: `${containerHeight}px` }} >
      <div className={styles.title_container}>
        <div className={styles.title}>{unit.title}</div>
        <div className={styles.title}>{day}</div>
      </div>

      {!operView && <div style={{ height: containerHeight }}>
        {hoursScaleReactNodes}
      </div>}

      {operView && (currentOper.id) &&
        <LoadOperProcess
          containerHeight={containerHeight}
          oper={currentOper}
          isQualControl={isQualControl}
          tCard={currentTCard}
          operInfo={{
            title: currentLoad.loadInfo?.title || "",
            duration: currentLoad.loadInfo?.duration || 0,
            interruptible: currentLoad.loadInfo?.interruptible ?? false,
            koef: currentLoad.loadInfo?.koef || 1,
            start: terms.start,
            finish: terms.finish
          }}
          setOperStatusHandler={setOperStatusHandler}
          // readyOperHandler={readyOperHandler}
          // defectOperHandler={defectOperHandler}
          closeOperHandler={closeOperHandler}
        />}
      {/* Загрузчик пока карта не загрузилась */}
      {operView && (!currentOper.id) &&
        <div className={styles.loader_container}>
          <div className={styles.title}>Ждем...</div>
          <ButtonLoader width={100} height={100} />
        </div>
      }

      <div className={styles.bottom_container}>
        <div className={styles.bottom_line}>Загрузка {work}% времени</div>
        <div className={styles.bottom_line}>результат {result}% : брак {defect}%</div>

      </div>
    </div>
  );
};

export default UnitTaskStackProcess;
