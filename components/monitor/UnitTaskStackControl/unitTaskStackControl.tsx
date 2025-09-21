
import React, { useEffect, useState, useRef } from 'react';
import styles from "./unitTaskStackControl.module.scss";
import { openOperation } from '@/services/monitor/openOperation';
import { setOperationStatus } from '@/services/monitor/unitControl/setOperationStatus';
import { UnitLoadItem, UnitItem, TCardItem, TCardOperationItem, StatusEnum } from "@/types/types";
import LoadMonitorControl from "./LoadMonitorControl/loadMonitorControl";
import LoadOperControl from "./LoadOperControl/loadOperControl";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { useTranslation } from 'react-i18next';

import { padNumberToFourDigits } from "@/lib/client/utils.client"

interface UnitTaskStackProcessProps {
  unit: UnitItem,
  tCards: TCardItem[],
  day: string; // "YYYY-MM-DD", например, текущая дата
  performedLoads: UnitLoadItem[]; // Все которые ждут проверки

  containerHeight?: number; // высота контейнера в пикселях, например, 600
  containerWidth?: number; // ширина контейнера в пикселях, например, 250
  isQualControl?: boolean // существует отдельно контроль качества
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
  performedLoads,
  containerHeight = 600,
  containerWidth = 250,
  isQualControl = false,
  setMessage,
  getStartFinishOper,
  setStatusLoadsHandler,
  teamId,
  userId,
  token
}) => {
  const { t } = useTranslation();
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

  // На сервере
  // Открываем операцию по нажатию кнопки юнитом 
  const openOperHandler = async (load: UnitLoadItem, id_oper: number, id_tCard: number) => {
    setOperView(true);
    await openOperation(load, id_oper, id_tCard, userId, teamId, token, t, setMessage,
      setCurrentTCard, setCurrentOper, setCurrentLoad);

    // setOperView(true);

    // // получаем полную операцию и разворачиваем
    // // Запрос на сервер

    // try {
    //   const res = await fetch(`api/tcard-api?userId=${userId}&teamId=${userId}&tCardId=${id_tCard}`,
    //     {
    //       method: 'get',
    //       headers: new Headers({
    //         'Authorization': 'Basic ' + token,
    //         'Content-Type': 'application/json'
    //       }),
    //     }
    //   );
    //   if (res.status !== 200) {
    //     const receivedData = await res.json();
    //     setMessage(receivedData.message);

    //     //  console.log(t('service.serverUnavailable') + res.status);
    //     // setMessage(t('service.serverUnavailable') + res.status);
    //   } else {
    //     const receivedData = await res.json();
    //     // console.log("receivedData", receivedData)
    //     setMessage(receivedData.message);
    //     if (receivedData.success) {
    //       //   Обновим текущую карту
    //       const tCard = receivedData.tCard as TCardItem
    //       setCurrentTCard(tCard);
    //       const oper = tCard.tCardOperations?.find((oper) => oper.id === id_oper);
    //       if (!oper) return
    //       setCurrentOper(oper as TCardOperationItem);
    //       setCurrentLoad(load as UnitLoadItem);
    //       setMessage(receivedData.message);
    //     }
    //   }

    //   // } catch (e: any) {
    //   //   // setMessage(t('service.serverUnavailable') + e.message)            
    //   // }
    // } catch (e: unknown) {
    //   let message = t('service.serverUnavailable');
    //   if (e instanceof Error) {
    //     message += e.message;
    //   }
    //   setMessage(message);
    // }

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
  // Меняем статус операции по нажатию кенопки юнитом 
  const setOperStatusHandler = async (status: StatusEnum) => {
    setOperView(false);

    await setOperationStatus(status, currentOper, currentLoad, currentTCard, performedLoads,
      token, teamId, userId, t, setMessage,
      setStatusLoadsHandler,

    );
    // const operloadsIds = performedLoads
    //   .filter(lo => lo.id_oper === currentOper.id && lo.version === currentLoad.version && lo.status === StatusEnum.performed)
    //   .map(load => load.id as number); //  все лоады операции

    // try {
    //   const res = await fetch(`api/tcard-oper-status-api`,
    //     {
    //       method: 'post',
    //       headers: new Headers({
    //         'Authorization': 'Basic ' + token,
    //         'Content-Type': 'application/json'
    //       }),
    //       body: JSON.stringify({
    //         tCardId:currentLoad.id_tCard,
    //         operId: currentOper.id,
    //         // loadsIds: operloadsIds,
    //         status: status,
    //         teamId: teamId,
    //         userId: userId,
    //         version:currentLoad.version,
    //       }),
    //     }
    //   );
    //   if (res.status !== 200) {
    //     const receivedData = await res.json();
    //     setMessage(receivedData.message);

    //     //  console.log(t('service.serverUnavailable') + res.status);
    //     // setMessage(t('service.serverUnavailable') + res.status);
    //   } else {
    //     const receivedData = await res.json();
    //     // console.log("receivedData", receivedData)
    //     setMessage(receivedData.message);
    //     if (receivedData.success) {
    //       // проверили и вернули общий статус карты
    //       const tCardStatus = receivedData.tCardStatus as StatusEnum
    //       //   Обновим статус лоадов
    //       setStatusLoadsHandler(tCardStatus, status, operloadsIds, Number(currentOper.id), currentTCard.id);
    //       setMessage(receivedData.message);
    //     }
    //   }

    // } catch (e: unknown) {
    //   let message = t('service.serverUnavailable');
    //   if (e instanceof Error) {
    //     message += e.message;
    //   }
    //   setMessage(message);
    // }

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
      // titleCard = `${padNumberToFourDigits(tCard.idc)} - ${new Date(tCard.date).toLocaleDateString("en-CA")};`
      titleCard = `${padNumberToFourDigits(tCard.idc)} - ${tCard.date};`


    return <LoadMonitorControl
      key={index}
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
  const work = Math.round((statistic.current.busyTime / statistic.current.workTime) * 100);
  let result = 0;
  let defect = 0;
  if (statistic.current.busyTime !== 0) {
    result = Math.round((statistic.current.resultTime / statistic.current.busyTime) * 100);
    defect = Math.round((statistic.current.defectedTime / statistic.current.busyTime) * 100);
  }

  return (
    <div className={styles.container}
      style={{ minHeight: `${containerHeight}px`, height: `${containerHeight + 120}px`, maxWidth: `${containerWidth}px` }} >
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

      </div>
    </div>
  );
};

export default UnitTaskStackProcess;
