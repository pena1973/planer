
import React, { useEffect, useState, useRef } from 'react';
import styles from "./reportTCardState.module.scss";
import { StatusEnum, TCardTermsItem } from "@/types";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import Image from 'next/image';
import { padNumberToFourDigits, convertMinutesToTime } from "@/utils"

interface ReportTCardStateProps {
  setMessage: (message: string) => void,
}


const ReportTCardState: React.FC<ReportTCardStateProps> = ({
  setMessage,
}) => {


  const [tCardsValue, setTCardsValue] = useState([] as TCardTermsItem[]);
  // список id карт которые нужно развернуть
  const [expandValue, setExpandValue] = useState([] as number[]);
  const [showLoader, setShowLoader] = useState(false);
  const getTCardsTerms = async () => {
    setShowLoader(true);
    try {
      const res = await fetch(`api/tcards-opers-terms-api?userId=${1}&companyId=${1}`,
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

        if (receivedData.success) {

          setTCardsValue(receivedData.tCards as TCardTermsItem[]); //  получаем карту с операциями
          setMessage(receivedData.message);
        }
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
    setShowLoader(false);
  }

  useEffect(() => {
    getTCardsTerms();
  }, []);


  let tCardsValueReactNodes = tCardsValue.map((tCard, index) => {

    let commonDuration = 0;
    let readyDuration = 0;
    const tCardOperationsReactNodes = tCard.tCardOperations.map((oper, index) => {
      commonDuration += oper.duration;
      const operStatusStyle = oper.status === StatusEnum.ready ? styles.ready : oper.status === StatusEnum.defective ? styles.defective : styles.planed;
      let operReady = 0;
      if (oper.status === StatusEnum.ready) {
        operReady = 100;
        readyDuration += oper.duration;
      }
      if (oper.status === StatusEnum.performed) {
        operReady = 50;
        readyDuration += (oper.duration / 2);
      }
      return (
        <tr key={`${tCard.id}-${index}`}>
          <td></td>
          <td className={styles.operation_title}> {oper.action.title}</td>
          <td className={styles.operation_row}> <div className={styles.status_row}>
            <div className={operStatusStyle} />
            {oper.status}
          </div>
          </td>
          <td className={styles.operation_row}>{(oper.readyTerm.date === '0001-01-01') ? "" : `${oper.readyTerm.date} : ${convertMinutesToTime(oper.readyTerm.time)}`}</td>
          <td className={styles.operation_row}>{operReady}%</td>
        </tr>
      )
    })
    const cardTitle = tCard ? `${padNumberToFourDigits(tCard.number)} - ${new Date(tCard.date).toLocaleDateString('en-CA')}` : "";
    const cardStatusStyle = tCard.status === StatusEnum.ready ? styles.ready : tCard.status === StatusEnum.defective ? styles.defective : styles.planed;

    if (commonDuration === 0) commonDuration = 1; // чтобы не делить на ноль
    let cardReady = Math.round(readyDuration / commonDuration * 100);
    return (<>

      <tr key={index}>
        <td>
          <div className={styles.expand_row}
            onClick={() => {
              if (expandValue.includes(tCard.id)) {
                // убираем из списка
                setExpandValue(expandValue.filter((id) => id !== tCard.id));
              } else {
                // добавляем в список
                setExpandValue([...expandValue, tCard.id]);
              }
            }
            }>+</div></td>
        <td> {cardTitle}</td>
        <td> <div className={styles.status_row}>
          <div className={cardStatusStyle} />
          {tCard.status}
        </div>
        </td>
        <td>{(tCard.readyTerm.date === '0001-01-01') ? "" : `${tCard.readyTerm.date} : ${convertMinutesToTime(tCard.readyTerm.time)}`}</td>
        <td> {cardReady}%</td>
      </tr>
      {expandValue.includes(tCard.id) && tCardOperationsReactNodes}
    </>
    )
  })


  return (
    <div className={styles.container}>
      {showLoader &&
        <div className={styles.loader_container}>
          <div className={styles.title}>Ждем...</div>
          <ButtonLoader width={100} height={100} />
        </div>
      }
      {!showLoader && <div>  фильтр заглушка</div>}
      {!showLoader && <div className={styles.table_container}>
        {/* Шапка таблицы */}
        <table className={styles._table}>
          <thead>
            <tr>
              <th >
                <div className={styles.expand_row}
                  onClick={() => {
                    if (expandValue.length !== 0) {
                      // убираем из списка
                      setExpandValue([] as number[]);
                    } else {
                      // добавляем в список
                      setExpandValue(tCardsValue.map((tCard) => tCard.id));
                    }
                  }}>{(expandValue.length !== 0) ? "—" : "+"}</div>
              </th>
              <th >Карта, Операция</th>
              <th >Статус</th>
              <th >Срок готовности</th>
              <th >Готовность</th>
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
