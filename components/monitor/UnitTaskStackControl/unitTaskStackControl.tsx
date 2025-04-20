
import React, { useEffect, useState, useRef } from 'react';
import styles from "./unitTaskStackControl.module.scss";
import { CalendarItem, UnitLoadItem, UnitExceptionItem, UnitItem, SettingsItem, ScheduleItem, DaysOfWeek, TCardItem, TimeTypeEnum, TCardOperationItem, StatusEnum } from "@/types";
import LoadMonitorControl from "./LoadMonitorControl/loadMonitorControl";
import LoadOperControl from "./LoadOperControl/loadOperControl";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { formatDate, padNumberToFourDigits, ISOStringToLocalDateTime } from "@/utils"

interface UnitTaskStackProcessProps {
  unit: UnitItem,
  tCards: TCardItem[],
  day: string; // "YYYY-MM-DD", например, текущая дата
  performedLoads: UnitLoadItem[]; // Все которые ждут проверки

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
  performedLoads,
  containerHeight = 600,
  isQualControl = false,
  setMessage,
  getStartFinishOper,
  setStatusLoadsHandler
}) => {
  // Определяем, что день начинается в 0 и заканчивается в 1440 минут (24 часа)

  const [operView, setOperView] = useState(false);
  const [currentOper, setCurrentOper] = useState({} as TCardOperationItem);
  const [currentTCard, setCurrentTCard] = useState({} as TCardItem);
  const [currentLoad, setCurrentLoad] = useState({} as UnitLoadItem);
  const statistic = useRef({} as { workTime: number, busyTime: number, defectedTime: number, resultTime: number });

  useEffect(() => {
    setOperView(false);
    setCurrentOper({} as TCardOperationItem);
    setCurrentTCard({} as TCardItem);
    setCurrentLoad({} as UnitLoadItem);
  }, [day])

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
    const operloadsIds = performedLoads
      .filter(lo => lo.id_oper === currentOper.id && lo.version === currentLoad.version && lo.status === StatusEnum.performed)
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


  function getFirstLoads(loads: UnitLoadItem[]): UnitLoadItem[] {
    // Группируем лоады по id_oper, исключая те, где isRetool === true
    const groups = new Map<number, UnitLoadItem[]>();

    loads.forEach(load => {
      if (!load.isRetool) {
        const opId = load.id_oper;
        if (!groups.has(opId)) {
          groups.set(opId, []);
        }
        groups.get(opId)!.push(load);
      }
    });

    // Для каждой группы выбираем лоад с минимальным timeStart
    const firstLoads: UnitLoadItem[] = [];
    groups.forEach(group => {
      // Находим элемент с минимальным timeStart внутри группы
      const firstLoad = group.reduce((minLoad, currentLoad) =>
        currentLoad.timeStart < minLoad.timeStart ? currentLoad : minLoad, group[0]);
      firstLoads.push(firstLoad);
    });

    return firstLoads;
  }

  const performedLoads__ = getFirstLoads(performedLoads); //  отбираем только первые лоады для каждой операции performed

  const loadsReactNodes = performedLoads__.map((load, index) => {
    let titleCard = "";
    const tCard = tCards.find(tCard => tCard.id === load.id_tCard); // ищем карточку          
    if (tCard)
      titleCard = `${padNumberToFourDigits(tCard.number)} - ${new Date(tCard.date).toLocaleDateString("en-CA")};`

    return <LoadMonitorControl
      loadHeight={40}
      showTitle={true}
      load={load}
      titleCard={titleCard}
      openOperHandler={openOperHandler}
      index={index}

    />
  })



  const terms = getStartFinishOper(currentLoad);

  // статистика работы юнита в этот день
  let work = Math.round((statistic.current.busyTime / statistic.current.workTime) * 100);
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

      {!operView && <div className={styles.load_container} style={{ height: containerHeight }}>
        {isQualControl && loadsReactNodes}
        {!isQualControl &&
          <div className={styles.title}>
            Функции контролера необходимо включить в настройках программы.
            Обратитесь к администратору. </div>}
      </div>}


      {operView && (currentOper.id) &&
        <LoadOperControl
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
        {/* <div className={styles.bottom_line}>Загрузка {work}% времени</div>
        <div className={styles.bottom_line}>результат {result}% : брак {defect}%</div> */}

      </div>
    </div>
  );
};

export default UnitTaskStackProcess;
