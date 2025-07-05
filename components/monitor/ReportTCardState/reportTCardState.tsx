
import React, { useEffect, useState } from 'react';
import styles from "./reportTCardState.module.scss";
import { getTCardsTerms } from '@/services/monitor/getTCardsTerms';

import { StatusEnum, TCardTermsItem, UnitLoadItem } from "@/types/types";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import Filter from "./Filter/filter";

import { useTranslation } from 'react-i18next';


import { padNumberToFourDigits, convertMinutesToTime } from "@/lib/utils"

interface ReportTCardStateProps {
  setMessage: (message: string) => void,
  teamId: number,
  userId: number,
  token: string
}

const ReportTCardState: React.FC<ReportTCardStateProps> = ({
  setMessage,
  teamId,
  userId,
  token
}) => {
  const { t, i18n } = useTranslation();

  const [tCardsValue, setTCardsValue] = useState([] as TCardTermsItem[]);
  const [unitLoadsValue, setUnitLoadsValue] = useState([] as UnitLoadItem[]);

  // список id карт которые нужно развернуть
  const [expandCardValue, setExpandCardValue] = useState([] as number[]);
  const [expandOperValue, setExpandOperValue] = useState([] as number[]); // id  oper

  const [showLoader, setShowLoader] = useState(false);

  // На сервере
  const getTCardsTermsHandler = async (
    useNumber?: boolean,
    useDate?: boolean,
    useStatus?: boolean,
    tCardNumber?: number,
    tCardDateFrom?: string,
    tCardDateTo?: string,
    tCardStatus?: StatusEnum | "",) => {

    setShowLoader(true);

    let filter = "";
    // фильтр
    if (useNumber && tCardNumber) filter = filter.concat(`&tCardNumber=${tCardNumber}`)
    if ((useDate) && (tCardDateFrom)) filter = filter.concat(`&tCardDateFrom=${tCardDateFrom}`)
    if ((useDate) && (tCardDateTo)) filter = filter.concat(`&tCardDateTo=${tCardDateTo}`)
    if (useStatus) filter = filter.concat(`&tCardStatus=${tCardStatus}`)

    await getTCardsTerms(userId, teamId, token, t, setMessage,
      setUnitLoadsValue, setTCardsValue, filter,);

    setShowLoader(false);
  }

  useEffect(() => {
    getTCardsTermsHandler();
  }, []);

  // На клиенте
  const getStyleStatus = (status: StatusEnum): string => {

    switch (status) {
      case StatusEnum.prepared:
        return `${styles.status} ${styles.prepared}`;

      case StatusEnum.planed:
        return `${styles.status} ${styles.planed}`;


      case StatusEnum.ready:
        return `${styles.status} ${styles.ready}`;


      case StatusEnum.defective:
        return `${styles.status} ${styles.defective}`;


      case StatusEnum.performed:
        return `${styles.status} ${styles.performed}`;


      case StatusEnum.cancelled:
        return `${styles.status} ${styles.cancelled}`;


      case StatusEnum.closed:
        return `${styles.status} ${styles.closed}`;


      default:
        return `${styles.status} ${styles.draft}`;

    }
  }
  const tCardsValueReactNodes = tCardsValue.map((tCard, index) => {
    // лоады карты
    const tCardLoads = unitLoadsValue.filter(lo => lo.id_tCard === tCard.id)

    let commonDuration = 0;
    let readyDuration = 0;

    const tCardOperationsReactNodes = tCard.tCardOperations.map((oper, index) => {

      // Группируем лоады по версии
      const groupedLodes = tCardLoads
        .filter(lo => lo.idc_oper === oper.idc) // Фильтруем лоады по операции
        .filter(lo => !lo.isRetool) // Исключаем лоады с isRetool = true
        .reduce<Record<number, { status: StatusEnum, dateStart: string, timeStart: number, dateFinish: string, timeFinish: number, version: number }>>((acc, load) => {
          // Создаем уникальный ключ для группы по версии
          const key = load.version;

          // Если группа для этой версии еще не существует, создаем пустую группу
          if (!acc[key]) {
            // Для первого лоада в группе сохраняем статус и даты начала и завершения
            acc[key] = {
              status: load.status, // Статус из первого лоада
              dateStart: load.date,
              timeStart: load.timeStart,
              dateFinish: load.date,
              timeFinish: load.timeFinish,
              version: load.version,
            };
          } else {
            // Обновляем только даты начала и завершения, а статус не меняем
            acc[key].dateStart = (acc[key].dateStart > load.date) ? load.date : acc[key].dateStart;
            acc[key].dateStart = (acc[key].dateFinish < load.date) ? load.date : acc[key].dateStart;
            acc[key].timeStart = Math.min(acc[key].timeStart, load.timeStart);
            acc[key].timeFinish = Math.max(acc[key].timeFinish, load.timeFinish);
          }

          return acc;
        }, {});
      // Преобразуем объект обратно в массив, если необходимо
      const operLoads = Object.values(groupedLodes);

      // делаем реакт узел
      const operLoadsReactNodes = operLoads
        .map((lo) => {
          const loStatusStyle = getStyleStatus(lo.status);
          return (
            <tr key={`${tCard.id}-${index}`}>
              <td></td>
              <td className={styles.operation_title}>
                &nbsp;&nbsp; {t('reportTCardState.start')} {lo.dateStart}: {convertMinutesToTime(lo.timeStart)} - {t('reportTCardState.finish')} {lo.dateFinish}: {convertMinutesToTime(lo.timeFinish)}</td>
              <td className={styles.operation_row}><div className={styles.status_row}>
                <div className={loStatusStyle} />
                {lo.status}
              </div>
              </td>
              <td className={styles.operation_row}></td>
              <td className={styles.operation_row}></td>
            </tr>)
        }
        );

      if (oper.status !== StatusEnum.cancelled && oper.status !== StatusEnum.defective)
        commonDuration += oper.duration;

      const operStatusStyle = getStyleStatus(oper.status);
      let operReady = 0;
      if (oper.status === StatusEnum.ready) {
        operReady = 100;
        readyDuration += oper.duration;
      }
      if (oper.status === StatusEnum.performed) {
        operReady = 50;
        readyDuration += (oper.duration / 2);
      }
      const fixTitle = (oper.fixOperIdc) ? `, исправление A ${oper.fixOperIdc}` : ``;

      return (<>
        <tr key={`${tCard.id}-${index}`}>
          <td>
            <div className={styles.expand_row}
              onClick={() => {
                if (expandOperValue.includes((oper.id) ? oper.id : NaN)) {
                  // убираем из списка
                  setExpandOperValue(expandCardValue.filter((id) => id !== oper.id));
                } else {
                  // добавляем в список
                  setExpandOperValue([...expandOperValue, (oper.id) ? oper.id : NaN]);
                }
              }
              }>&nbsp;&nbsp;{expandOperValue.includes((oper.id) ? oper.id : NaN) ? "—" : "+"}</div></td>
          <td className={styles.operation_title}> A{oper.idc}, {oper.action.title} {fixTitle} </td>
          <td className={styles.operation_row}>
            <div className={styles.status_row}>
              <div className={operStatusStyle} />
              {oper.status}
            </div>
          </td>
          <td className={styles.operation_row}>{(oper.readyTerm.date === '0001-01-01' || oper.readyTerm.date === '') ? "" : `${oper.readyTerm.date} : ${convertMinutesToTime(Number(oper.readyTerm.time))}`}</td>
          <td className={styles.operation_row}>{operReady}%</td>
        </tr>
        {expandOperValue.includes((oper.id) ? oper.id : NaN) && operLoadsReactNodes}

      </>
      )
    })
    const cardTitle = tCard ? `${padNumberToFourDigits(tCard.idc)} - ${new Date(tCard.date).toLocaleDateString('en-CA')}` : "";
    // статус
    const cardStatusStyle = getStyleStatus(tCard.status);

    if (commonDuration === 0) commonDuration = 1; // чтобы не делить на ноль
    const cardReady = Math.round(readyDuration / commonDuration * 100);
    const time = tCard.readyTerm.time;
    return (<React.Fragment key={tCard.id}>

      <tr key={index}>
        <td>
          <div className={styles.expand_row}
            onClick={() => {
              if (expandCardValue.includes(tCard.id)) {
                // убираем из списка
                setExpandCardValue(expandCardValue.filter((id) => id !== tCard.id));
              } else {
                // добавляем в список
                setExpandCardValue([...expandCardValue, tCard.id]);
              }
            }
            }>{expandCardValue.includes(tCard.id) ? "—" : "+"}</div></td>
        <td> {cardTitle}</td>
        <td> <div className={styles.status_row}>
          <div className={cardStatusStyle} />
          {tCard.status}
        </div>
        </td>
        <td>{(tCard.readyTerm.date === '0001-01-01') ? "" : `${tCard.readyTerm.date} : ${convertMinutesToTime(Number(tCard.readyTerm.time))}`}</td>
        <td> {cardReady}%</td>
      </tr>
      {expandCardValue.includes(tCard.id) && tCardOperationsReactNodes}
    </React.Fragment>
    )
  })


  return (
    <div className={styles.container}>
      <Filter
        getTCardsTermsHandler={getTCardsTermsHandler}
        teamId={teamId}
        userId={userId}
      />
      {showLoader &&
        <div className={styles.loader_container}>
          <div className={styles.title}>{t('reportTCardState.wait')}</div>
          <ButtonLoader width={100} height={100} />
        </div>
      }
      {!showLoader && <div className={styles.table_container}>
        {/* Шапка таблицы */}
        <table className={styles._table}>
          <thead>
            <tr>
              <th >
                <div className={styles.expand_row}
                  onClick={() => {
                    if (expandCardValue.length !== 0) {
                      // убираем из списка
                      setExpandCardValue([] as number[]);
                    } else {
                      // добавляем в список
                      setExpandCardValue(tCardsValue.map((tCard) => tCard.id));
                    }
                  }}>{(expandCardValue.length !== 0) ? "—" : "+"}</div>
              </th>
              <th>{t('reportTCardState.card')}</th>
              <th>{t('reportTCardState.status')}</th>
              <th>{t('reportTCardState.term')}</th>
              <th>{t('reportTCardState.readines')}</th>
            </tr>
          </thead>
          <tbody>
            {tCardsValueReactNodes}

          </tbody>
        </table>


      </div>}
    </div>
  )
};

export default ReportTCardState;
