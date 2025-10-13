
import React, { useEffect, useState, useRef, useMemo } from 'react';
import styles from "./unitTaskStackProcess.module.scss";
import { openOperation } from '@/services/monitor/openOperation';
import { setOperationStatus } from '@/services/monitor/unitProcess/setOperationStatus';

import {
  CalendarItem, UnitLoadItem, UnitExceptionItem, UnitItem, SettingsItem, ScheduleItem,
  TCardItem, TimeTypeEnum, TCardOperationItem, StatusEnum
} from "@/types/types";

import LoadMonitorProcess from "./LoadMonitorProcess/loadMonitorProcess";
import LoadOperProcess from "./LoadOperProcess/loadOperProcess";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { generateCalendarItem, padNumberToFourDigits } from "@/lib/client/utils.client";

import { useTranslation } from 'react-i18next';

// Функция определяет что интервал в 5 минут является началом часа
// На клиенте
function isStartOfHour(intervTime: number): boolean {
  return intervTime % 60 === 0;
}
// Функция для визуализации времени для юзера
// На клиенте
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
  containerWidth?: number; // ширина контейнера в пикселях, например, 250
  setMessage: (message: string) => void,
  getStartFinishOper: (load: UnitLoadItem) => {
    start: { date: string, time: number },
    finish: { date: string, time: number }
  },
  setStatusLoadsHandler: (tCardStatus: StatusEnum, tOperStatus: StatusEnum, operloadsIds: number[], operId: number, tCardId: number) => void,
  teamId: number,
  userId: number,
  token: string
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
  containerWidth = 250,
  setMessage,
  getStartFinishOper,
  setStatusLoadsHandler,
  teamId,
  userId,
  token
}) => {
  const { t, i18n } = useTranslation();
  // Определяем, что день начинается в 0 и заканчивается в 1440 минут (24 часа)
  // const [calendarView, setCalendarView] = useState(generateCalendarItem(day, schedule) as CalendarItem);
  const calendarView = useMemo(() => generateCalendarItem(day, schedule) as CalendarItem, [day, schedule]
  );
  const [operView, setOperView] = useState(false); // показ колесика
  const [currentOper, setCurrentOper] = useState({} as TCardOperationItem);
  const [currentTCard, setCurrentTCard] = useState({} as TCardItem);
  const [currentLoad, setCurrentLoad] = useState({} as UnitLoadItem);
  const statistic = useRef({} as { workTime: number, busyTime: number, defectedTime: number, resultTime: number });

  let hoursScaleReactNodes = [] as JSX.Element[];

  // существует ли контроль качества?
  const isQualControl = settings.isQualControl;

  // Округляем время начала работы до целого числа
  const startQuant = Math.floor(settings.timeStartWork / 5);
  // Если время завершения работы равно 0, присваиваем значение 1440
  const timeFinishWork = settings.timeFinishWork === 0 ? 1440 : settings.timeFinishWork;
  // Округляем время завершения работы до целого числа и добавляем 1
  const finishQuant = Math.ceil(timeFinishWork / 5);
  // Рассчитываем количество промежуточных значений
  // const quants = finishQuant - startQuant;
  const intervalHeight = containerHeight / ((finishQuant - startQuant) / 1); // x интервалов по 5 минут в дне
  // }


  // useEffect(() => {
  //   const calendarView_ = generateCalendarItem(day, schedule);
  //   setCalendarView(calendarView_);
  //   setOperView(false);
  //   setCurrentOper({} as TCardOperationItem);
  //   setCurrentTCard({} as TCardItem);
  //   setCurrentLoad({} as UnitLoadItem);
  // }, [day, schedule])
  useEffect(() => {
    // день сменился — закрываем детали, очищаем выбор
    setOperView(false);
    setCurrentOper({} as TCardOperationItem);
    setCurrentTCard({} as TCardItem);
    setCurrentLoad({} as UnitLoadItem);
  }, [day]);
  // На сервере
  // Открываем операцию по нажатию кнопки юнитом 
  const openOperHandler = async (load: UnitLoadItem, id_oper: number, id_tCard: number) => {
    setOperView(true);
    await openOperation(load, id_oper, id_tCard, userId, teamId, token, t, i18n.language,  setMessage,
      setCurrentTCard, setCurrentOper, setCurrentLoad);
  }

  // На клиенте
  // Закрываем операцию без изменения по нажатию кенопки юнитом 
  const closeOperHandler = (): void => {
    setOperView(false);
    setCurrentOper({} as TCardOperationItem);
    setCurrentTCard({} as TCardItem);
    setCurrentLoad({} as UnitLoadItem);

  }

  // На сервере
  // Меняем статус операции по нажатию кнопки юнитом 
  const setOperStatusHandler = async (status: StatusEnum, operId: number, tCardId: number) => {
    await setOperationStatus(status, operId, tCardId, currentLoad.version, teamId, userId, token, t, i18n.language, 
      setMessage, setStatusLoadsHandler);

    setCurrentOper({} as TCardOperationItem);
    setCurrentTCard({} as TCardItem);
    setCurrentLoad({} as UnitLoadItem);
    // закроем детали операции
    setOperView(false);
  }

  // На клиенте
  // Функция для генерации шкалы времени  и загруза юнитов для одного дня
  const generateTimeScaleMonitor = (calendarItem: CalendarItem): JSX.Element[] => {
    const intervalsReactNodes = [] as JSX.Element[];
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
    // 288 5 минуток в дне (24 часа * 60/5 минут)  если показывать полные сутки

    // Округляем время начала работы до целого числа
    const startQuant = Math.floor(settings.timeStartWork / 5);
    // Если время завершения работы равно 0, присваиваем значение 1440
    const timeFinishWork = settings.timeFinishWork === 0 ? 1440 : settings.timeFinishWork;
    // Округляем время завершения работы до целого числа и добавляем 1
    const finishQuant = Math.ceil(timeFinishWork / 5);
    // Рассчитываем количество промежуточных значений
    const quants = finishQuant - startQuant;



    for (let i = startQuant; i < finishQuant; i++) {
      const intervTime = i * 5;
      const isWorkTime = intervTime >= calendarItem.timeStartWork && intervTime < calendarItem.timeFinishWork;
      const isBreakTime = calendarItem.breaks.some(breakPeriod =>
        intervTime >= breakPeriod.timeStart && intervTime < breakPeriod.timeFinish
      );

      thisWorkinterval = isWorkTime && !isBreakTime

      //  расписание предприятия
      const timeStyle = isBreakTime
        ? styles.breakTime  // Если время перерыв, применяем стиль для перерыва
        : isWorkTime
          ? styles.workTime  // Если это рабочее время, применяем стиль для рабочего времени
          : styles.nonWorkTime;  // Если не рабочее и не перерыв, применяем стиль для не рабочего времени

      //  вычисление визуализации загруза юнита  с учетом исключений   
      let unit_unloadEx = "";
      // const exs = unitExceptions.filter(ex => ex.unitId === unit.id && ex.date === calendarItem.date.toLocaleDateString("en-CA"));
      const exs = unitExceptions.filter(ex => ex.unitId === unit.id && ex.date === calendarItem.date);


      if (exs.length > 0) {
        // Если есть исключения устанавливатся новое время работы  индивидуально юниту
        // в этом случае оно заменяет общее расписание (Type Work)
        //  также устанавливаютсядругие перерывы на эту дату если изменилось время работы
        // либо может быть установлено не работа

        const exNotWork = exs.find(ex =>
          ex.type === TimeTypeEnum.notWork && intervTime >= ex.timeStart && intervTime < ex.timeFinish)
        if (exNotWork) {
          unit_unloadEx = styles.nonWorkTime;
          thisWorkinterval = false; //  не рабочий интервал
        }

        const exWork = exs.find(ex => ex.type === TimeTypeEnum.work)
        if (exWork) {
          unit_unloadEx = (intervTime >= exWork.timeStart && intervTime < exWork.timeFinish) ? styles.workTime : styles.nonWorkTime
          thisWorkinterval = (intervTime >= exWork.timeStart && intervTime < exWork.timeFinish); //  не рабочий интервал
        }

        const exBreack = exs.filter(ex => ex.type === TimeTypeEnum.breack)
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
            // titleCard = `${padNumberToFourDigits(tCard.idc)} - ${new Date(tCard.date).toLocaleDateString("en-CA")};`
            titleCard = `${padNumberToFourDigits(tCard.idc)} - ${tCard.date};`

          return <LoadMonitorProcess
            key={'quant' + i}
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
        <div key={'quant' + i}
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

  hoursScaleReactNodes = generateTimeScaleMonitor(calendarView);

  const terms = getStartFinishOper(currentLoad);

  // статистика работы юнита в этот день
  const work = statistic.current.workTime === 0 ? 0 : Math.round((statistic.current.busyTime / statistic.current.workTime) * 100);
  let result = 0;
  let defect = 0;
  if (statistic.current.busyTime !== 0) {
    result = Math.round((statistic.current.resultTime / statistic.current.busyTime) * 100);
    defect = Math.round((statistic.current.defectedTime / statistic.current.busyTime) * 100);
  }

  return (
    <div key={unit.id} className={styles.container}
      style={{ minHeight: `${containerHeight}px`, height: `${containerHeight + 120}px`, maxWidth: `${containerWidth}px` }} >
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
        <div className={styles.bottom_line}>{t('unitTaskStackProcess.loading')} {work}% {t('unitTaskStackProcess.time')}</div>
        <div className={styles.bottom_line}>{t('unitTaskStackProcess.result')} {result}% : {t('unitTaskStackProcess.defect')} {defect}%</div>
      </div>
    </div>
  );
};

export default UnitTaskStackProcess;
