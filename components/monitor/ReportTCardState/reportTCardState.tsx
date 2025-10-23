
import React, { useEffect, useState, useMemo } from 'react';
import styles from "./reportTCardState.module.scss";
import { getTCardsTerms } from '@/services/monitor/getTCardsTerms';

import { StatusEnum, TCardTermsItem, UnitLoadItem } from "@/types/types";

import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import Filter from "./Filter/filter";

import { useTranslation } from 'react-i18next';
import { padNumberToFourDigits, convertMinutesToTime } from "@/lib/client/utils.client"

interface ReportTCardStateProps {
  setMessage: (message: string) => void,
  teamId: number,
  userId: number,
  token: string
}


const statusClass: Record<StatusEnum | 'draft', string> = {
  [StatusEnum.prepared]:  `${styles.status} ${styles.prepared}`,
  [StatusEnum.planed]:    `${styles.status} ${styles.planed}`,
  [StatusEnum.ready]:     `${styles.status} ${styles.ready}`,
  [StatusEnum.defective]: `${styles.status} ${styles.defective}`,
  [StatusEnum.performed]: `${styles.status} ${styles.performed}`,
  [StatusEnum.cancelled]: `${styles.status} ${styles.cancelled}`,
  [StatusEnum.closed]:    `${styles.status} ${styles.closed}`,
  draft:                  `${styles.status} ${styles.draft}`,
};

const compareYmd = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0);

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
    showClosed?: boolean,
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
    filter = filter.concat(`&showClosed=${showClosed}`)
    if (useStatus) filter = filter.concat(`&tCardStatus=${tCardStatus}`)

    await getTCardsTerms(userId, teamId, token, t, i18n.language, setMessage,
      setUnitLoadsValue, setTCardsValue, filter,);

    setShowLoader(false);
  }

  useEffect(() => {
    getTCardsTermsHandler();
  }, []);

  
  const getStyleStatus = (status: StatusEnum): string =>
  statusClass[status] ?? statusClass.draft;
  
  // Сгруппировать лоады ОДНИМ проходом: tCard -> operIdc -> version -> склеянный интервал
  type GroupedLoad = {
    status: StatusEnum;
    dateStart: string;
    timeStart: number;
    dateFinish: string;
    timeFinish: number;
    version: number;
  };

  const loadsIndex = useMemo(() => {
    // Map<tCardId, Map<operIdc, Map<version, GroupedLoad>>>
    const byTCard = new Map<number, Map<number, Map<number, GroupedLoad>>>();

    for (const load of unitLoadsValue) {
      if (load.isRetool) continue;

      const tCardId = load.id_tCard;
      const operIdc = load.idc_oper ?? 0;
      const version = load.version ?? 0;

      let byOper = byTCard.get(tCardId);
      if (!byOper) { byOper = new Map(); byTCard.set(tCardId, byOper); }

      let byVersion = byOper.get(operIdc);
      if (!byVersion) { byVersion = new Map(); byOper.set(operIdc, byVersion); }

      const existing = byVersion.get(version);
      if (!existing) {
        byVersion.set(version, {
          status: load.status,
          dateStart: load.date,
          timeStart: load.timeStart,
          dateFinish: load.date,
          timeFinish: load.timeFinish,
          version,
        });
      } else {
        // Минимальный start
        if (compareYmd(load.date, existing.dateStart) < 0) {
          existing.dateStart = load.date;
          existing.timeStart = load.timeStart;
        } else if (load.date === existing.dateStart) {
          existing.timeStart = Math.min(existing.timeStart, load.timeStart);
        }

        // Максимальный finish
        if (compareYmd(load.date, existing.dateFinish) > 0) {
          existing.dateFinish = load.date;
          existing.timeFinish = load.timeFinish;
        } else if (load.date === existing.dateFinish) {
          existing.timeFinish = Math.max(existing.timeFinish, load.timeFinish);
        }

        // Статус можно «усиливать» при необходимости, но оставим как был у первого
      }
    }

    return byTCard;
  }, [unitLoadsValue]);

  const tCardsValueReactNodes = useMemo(() => {
    return tCardsValue.map((tCard) => {
      const byOper = loadsIndex.get(tCard.id); // Map<operIdc, Map<version, GroupedLoad>>

      let commonDuration = 0;
      let readyDuration = 0;

      const tCardOperationsReactNodes = tCard.tCardOperations.map((oper) => {
        // берём готовые сгруппированные лоады по операции
        const operIdc = oper.idc ?? 0;
        const groupedByVersion = byOper?.get(operIdc);
        const operLoads: GroupedLoad[] = groupedByVersion ? Array.from(groupedByVersion.values()) : [];

        const operLoadsReactNodes = operLoads.map((lo) => {
          const loStatusStyle = getStyleStatus(lo.status);
          return (
            <tr key={`lo-${tCard.id}-${operIdc}-${lo.version}`}>
              <td></td>
              <td className={styles.operation_title}>
                &nbsp;&nbsp; {t('reportTCardState.start')} {lo.dateStart}: {convertMinutesToTime(lo.timeStart)} - {t('reportTCardState.finish')} {lo.dateFinish}: {convertMinutesToTime(lo.timeFinish)}
              </td>
              <td className={styles.operation_row}>
                <div className={styles.status_row}>
                  <div className={loStatusStyle} />
                  {lo.status}
                </div>
              </td>
              <td className={styles.operation_row}></td>
              <td className={styles.operation_row}></td>
            </tr>
          );
        });

        if (oper.status !== StatusEnum.cancelled && oper.status !== StatusEnum.defective) {
          commonDuration += oper.duration;
        }

        const operStatusStyle = getStyleStatus(oper.status);
        let operReady = 0;
        if (oper.status === StatusEnum.ready) {
          operReady = 100;
          readyDuration += oper.duration;
        }
        if (oper.status === StatusEnum.performed) {
          operReady = 50;
          readyDuration += oper.duration / 2;
        }
        const fixTitle = oper.fixOperIdc ? `, ${t('reportTCardState.fixing')} A${oper.fixOperIdc}` : "";

        return (
          <React.Fragment key={`oper-${tCard.id}-${operIdc}`}>
            <tr>
              <td>
                <div
                  className={styles.expand_row}
                  onClick={() => {
                    const id = oper.id ?? NaN;
                    setExpandOperValue(prev =>
                      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
                    );
                  }}
                >
                  {expandOperValue.includes(oper.id ?? NaN) ? "—" : "+"}
                </div>
              </td>
              <td className={styles.operation_title}> A{oper.idc}, {oper.action.title}{fixTitle} </td>
              <td className={styles.operation_row}>
                <div className={styles.status_row}>
                  <div className={operStatusStyle} />
                  {oper.status}
                </div>
              </td>
              <td className={styles.operation_row}>
                {(oper.readyTerm.date === '0001-01-01' || !oper.readyTerm.date) ? "" : `${oper.readyTerm.date} : ${convertMinutesToTime(Number(oper.readyTerm.time))}`}
              </td>
              <td className={styles.operation_row}>{operReady}%</td>
            </tr>
            {expandOperValue.includes(oper.id ?? NaN) && operLoadsReactNodes}
          </React.Fragment>
        );
      });

      const cardTitle = `${padNumberToFourDigits(tCard.idc)} - ${tCard.date}`;
      const cardStatusStyle = getStyleStatus(tCard.status);
      if (commonDuration === 0) commonDuration = 1;
      const cardReady = Math.round(readyDuration / commonDuration * 100);

      return (
        <React.Fragment key={`card-${tCard.id}`}>
          <tr>
            <td>
              <div
                className={styles.expand_row}
                onClick={() => {
                  setExpandCardValue(prev =>
                    prev.includes(tCard.id) ? prev.filter(v => v !== tCard.id) : [...prev, tCard.id]
                  );
                }}
              >
                {expandCardValue.includes(tCard.id) ? "—" : "+"}
              </div>
            </td>
            <td>{cardTitle}</td>
            <td>
              <div className={styles.status_row}>
                <div className={cardStatusStyle} />
                {tCard.status}
              </div>
            </td>
            <td>{(tCard.readyTerm.date === '0001-01-01') ? "" : `${tCard.readyTerm.date} : ${convertMinutesToTime(Number(tCard.readyTerm.time))}`}</td>
            <td>{cardReady}%</td>
          </tr>
          {expandCardValue.includes(tCard.id) && tCardOperationsReactNodes}
        </React.Fragment>
      );
    });
    // важно: завязываемся на loadsIndex вместо raw unitLoadsValue
  }, [tCardsValue, loadsIndex, expandCardValue, expandOperValue, t]);


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
