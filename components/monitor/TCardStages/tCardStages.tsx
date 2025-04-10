
import React, { useEffect, useState, useRef } from 'react';
import styles from "./tCardStages.module.scss";
import { TCardItem, TCardOperationItem, StatusEnum, TCardTermsItem } from "@/types";

import Image from 'next/image';
import { padNumberToFourDigits } from "@/utils"

interface UnitTaskStackOutsourceProps {
  setMessage: (message: string) => void,
}


const UnitTaskStackOutsource: React.FC<UnitTaskStackOutsourceProps> = ({
  setMessage,
}) => {


  const [tCardsValue, setTCardsValue] = useState([] as TCardTermsItem[]);


  const getTCardsTerms = async () => {

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
  }

  useEffect(() => {
    getTCardsTerms();

  }, []);


  let tCardsValueReactNodes = tCardsValue.map((tCard, index) => {

    const cardTitle = tCard ? `${padNumberToFourDigits(tCard.number)} - ${new Date(tCard.date).toLocaleDateString('en-CA')}` : "";
    const statusStyle = tCard.status === StatusEnum.ready ? styles.ready : tCard.status === StatusEnum.defective ? styles.defective : styles.planed;
    return (

      <tr key={index}>
        <td>
          <div onClick={() => {
            // tCard.id
          }}>+</div> </td>
        <td> {cardTitle}</td>
        <td> <div className={styles.status_row}>
          <div className={statusStyle} />
          {tCard.status}
        </div>
        </td>
        <td>{`${tCard.readyTerm.date}: ${tCard.readyTerm.time} мин`}</td>
      </tr>)
  })


  return (
    <div className={styles.container}>

      {/* Шапка таблицы */}
      <table className={styles._table}>
        <thead>
          <tr>
            <th >
              <div className={styles.expand_row}>+</div>
            </th>
            <th >Карта, Операция</th>
            <th >Статус</th>
            <th >Срок готовности</th>
          </tr>
        </thead>
        <tbody>
          {tCardsValueReactNodes}

        </tbody>
      </table>


    </div>
  );
};

export default UnitTaskStackOutsource;
