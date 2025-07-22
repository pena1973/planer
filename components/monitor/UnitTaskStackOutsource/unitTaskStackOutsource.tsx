
import React from 'react';
import styles from "./unitTaskStackOutsource.module.scss";
import { setOperStatus } from '@/services/monitor/setOperStatus';
import { UnitLoadItem, TCardItem, StatusEnum } from "@/types/types";
import { useTranslation } from 'react-i18next';


import { padNumberToFourDigits, convertMinutesToTime1 } from "@/lib/utils"


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
  token: string
}

const UnitTaskStackOutsource: React.FC<UnitTaskStackOutsourceProps> = ({
  outerLoads,
  tCards,
  setMessage,
  getStartFinishOper,
  setStatusLoadsHandler,
  teamId,
  userId,
  token
}) => {

  const { t, i18n } = useTranslation();

  // Меняем статус операции по нажатию кенопки юнитом 
  // На сервере
  const setOperStatusHandler = async (currentLoad: UnitLoadItem, status: StatusEnum) => {
    setOperStatus(currentLoad, outerLoads, status, teamId, userId, token, t, setMessage, setStatusLoadsHandler);
  }

  // На клиенте
  const getFirstLoads = (loads: UnitLoadItem[]): UnitLoadItem[] => {
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

  const operValueReactNodes = outerLoads__.map((lo, index) => {

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
        <button className={styles.button_ready_top} onClick={() => setOperStatusHandler(lo, StatusEnum.ready)}>{t('unitTaskStackOutsource.ready')}</button>
      </td>
      <td className={styles.button_row}>
        <button className={styles.button_defected_top} onClick={() => setOperStatusHandler(lo, StatusEnum.defective)}>{t('unitTaskStackOutsource.defect')}</button>
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
