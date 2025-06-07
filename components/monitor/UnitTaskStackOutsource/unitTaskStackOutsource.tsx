
import React, { useEffect, useState, useRef } from 'react';
import styles from "./unitTaskStackOutsource.module.scss";
import { UnitLoadItem, TCardItem, StatusEnum } from "@/types";
import { useTranslation } from 'react-i18next';


import { padNumberToFourDigits, convertMinutesToTime1 } from "@/utils"


interface UnitTaskStackOutsourceProps {
  outerLoads: UnitLoadItem[], //все лоады в статусе план на внешних исполнителях
  tCards: TCardItem[],
  setMessage: (message: string) => void,
  getStartFinishOper: (load: UnitLoadItem) => {
    start: { date: string, time: number },
    finish: { date: string, time: number }
  },
  setStatusLoadsHandler: (tCardStatus: StatusEnum, tOperStatus: StatusEnum, operloadsIds: number[], operId: number, tCardId: number) => void,
  teamId: number,
  userId: number,
}

const UnitTaskStackOutsource: React.FC<UnitTaskStackOutsourceProps> = ({
  outerLoads,
  tCards,
  setMessage,
  getStartFinishOper,
  setStatusLoadsHandler,
  teamId,
  userId,
}) => {

  const { t, i18n } = useTranslation();

  // Меняем статус операции по нажатию кенопки юнитом 
  const setOperStatusHandler = async (currentLoad: UnitLoadItem, status: StatusEnum) => {

    const operloadsIds = outerLoads
      .filter(lo => lo.id_oper === currentLoad.id_oper && lo.version === currentLoad.version && lo.status === StatusEnum.planed)
      .map(load => load.id as number); //  все лоады операции

    try {
      const res = await fetch(`api/tcard-oper-status-api`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            operId: currentLoad.id_oper,
            loadsIds: operloadsIds,
            status: status,
            teamId: teamId,
            userId: userId,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessage(t('service.serverUnavailable') + receivedData.message);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)
        setMessage(receivedData.message);

        if (receivedData.success) {
          // проверили и вернули общий статус карты
          const tCardStatus = receivedData.tCardStatus as StatusEnum
          //   Обновим статус лоадов
          setStatusLoadsHandler(tCardStatus, status, operloadsIds, currentLoad.id_oper, currentLoad.id_tCard);
          setMessage(receivedData.message);
        }
      }

    } catch (e: any) {
      setMessage(t('service.serverUnavailable') + e.message)
    }
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


  const outerLoads__ = getFirstLoads(outerLoads); //  отбираем только первые лоады для каждой операции 

  let operValueReactNodes = outerLoads__.map((lo, index) => {

    const tCard = tCards.find(tCard => tCard.id === lo.id_tCard); // ищем карточку
    const terms = getStartFinishOper(lo);

    const cardTitle = tCard ? `${padNumberToFourDigits(tCard.idc)} - ${new Date(tCard.date).toLocaleDateString('en-CA')}` : "";
    const statusStyle = lo.status === StatusEnum.ready ? styles.ready : lo.status === StatusEnum.defective ? styles.defective : styles.planed;
    return (<tr key={index}>

      <td> {cardTitle}</td>
      <td> {lo.loadInfo?.title}, C{lo.idc_oper}</td>
      <td> {lo.unit.title}</td>
      <td>{`${terms.start.date}: ${convertMinutesToTime1(terms.start.time)}`}</td>
      <td>{`${terms.finish.date}: ${convertMinutesToTime1(terms.finish.time)}`}</td>
      <td> <div className={styles.status_row}>
        <div className={statusStyle} />
        {lo.status}
      </div>
      </td>
      <td className={styles.button_row}>
        <button className={styles.button_ready_top} onClick={() => setOperStatusHandler(lo, StatusEnum.ready)}>{t('unitTaskStackOutsource.ready')}Готов</button>
      </td>
      <td className={styles.button_row}>
        <button className={styles.button_defected_top} onClick={() => setOperStatusHandler(lo, StatusEnum.defective)}>{t('unitTaskStackOutsource.defect')}Брак</button>
      </td>
    </tr>)
  })


  return (
    <div className={styles.container}>

      {/* Шапка таблицы */}
      <table className={styles._table}>
        <thead>
          <tr>
            <th >{t('unitTaskStackOutsource.card')}</th>
            <th >{t('unitTaskStackOutsource.oper')}</th>
            <th >{t('unitTaskStackOutsource.unit')}</th>
            <th >{t('unitTaskStackOutsource.start')}</th>
            <th >{t('unitTaskStackOutsource.finish')}</th>
            <th >{t('unitTaskStackOutsource.status')}</th>
            <th >{t('unitTaskStackOutsource.ready')}</th>
            <th >{t('unitTaskStackOutsource.defect')}</th>
          </tr>
        </thead>
        <tbody>
          {operValueReactNodes}

        </tbody>
      </table>


    </div>
  );
};

export default UnitTaskStackOutsource;
