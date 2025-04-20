
import React, { useEffect, useState, useRef } from 'react';
import styles from "./unitTaskStackOutsource.module.scss";
import { CalendarItem, UnitLoadItem, UnitExceptionItem, UnitItem, SettingsItem, ScheduleItem, DaysOfWeek, TCardItem, TimeTypeEnum, TCardOperationItem, StatusEnum } from "@/types";

import Image from 'next/image';
import {padNumberToFourDigits,convertMinutesToTime1} from "@/utils"


interface UnitTaskStackOutsourceProps {
  outerLoads: UnitLoadItem[], //все лоады в статусе план на внешних исполнителях
  tCards: TCardItem[],
  // day: string; // "YYYY-MM-DD", например, текущая дата  
  setMessage: (message: string) => void,
  getStartFinishOper: (load: UnitLoadItem) => {
    start: { date: string, time: number },
    finish: { date: string, time: number }
  },
  setStatusLoadsHandler: (status: StatusEnum, operloadsIds: number[]) => void
}

const UnitTaskStackOutsource: React.FC<UnitTaskStackOutsourceProps> = ({
  outerLoads,
  tCards,
  // day,  
  setMessage,
  getStartFinishOper,
  setStatusLoadsHandler
}) => {



  // Меняем статус операции по нажатию кенопки юнитом 
  const setOperStatusHandler = async (currentLoad: UnitLoadItem, status: StatusEnum) => {

    const operloadsIds = outerLoads
      .filter(lo => lo.id_oper === currentLoad.id_oper && lo.version === currentLoad.version && lo.status === StatusEnum.planed)
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
            operId: currentLoad.id_oper,
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

    const cardTitle = tCard ? `${padNumberToFourDigits(tCard.number)} - ${new Date(tCard.date).toLocaleDateString('en-CA')}` : "";
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
        <button className={styles.button_ready_top} onClick={() => setOperStatusHandler(lo, StatusEnum.ready)}>Готов</button>
      </td>
      <td className={styles.button_row}>
        <button className={styles.button_defected_top} onClick={() => setOperStatusHandler(lo, StatusEnum.defective)}>Брак</button>
      </td>
    </tr>)
  })


  return (
    <div className={styles.container}>

      {/* Шапка таблицы */}
      <table className={styles._table}>
        <thead>
          <tr>
            <th >Карта</th>
            <th >Операция, код</th>
            <th >Юнит</th>
            <th >Старт</th>
            <th >Финиш</th>
            <th >Статус</th>
            <th >Готов</th>
            <th >Брак</th>
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
