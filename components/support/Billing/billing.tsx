
import React, { useEffect, useState, useRef } from 'react';
import styles from "./billing.module.scss";
import {BillItem } from "@/types";
import { useTranslation } from 'react-i18next';

interface BillingProps { 
  setMessage: (message: string) => void,
  teamId: number,
  userId: number,
}

export const Billing: React.FC<BillingProps> = ({
  // messages,
  setMessage,
  teamId,
  userId,
}) => {

  const { t, i18n } = useTranslation();
  const [billsValue, setBillsValue] = useState([] as BillItem[]); // переключатель между каталогами

  // Меняем статус операции по нажатию кенопки юнитом 
  const getBills = async () => {

    try {
      const res = await fetch(`api/billing-api?userId=${userId}&teamId=${teamId}`,
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
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessage(t('service.serverUnavailable') + receivedData.message);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)
        setMessage(receivedData.message);

        if (receivedData.success) {
          // проверили и вернули общий статус карты
          const bills = receivedData.bills as BillItem[];
          setBillsValue(bills);          
        }
      }

    } catch (e: any) {
      setMessage(t('service.serverUnavailable') + e.message)
    }
  }

  let billsReactNodes = billsValue.map((bill, index) => {
    return (<tr key={index}>
      <td> {bill.date}</td>
      <td> {bill.title}</td>
      <td> {bill.file}</td>
      <td>{bill.paid}</td>
    </tr>)
  })

  useEffect(() => {
    getBills();
  }, []);

  return (
    <div className={styles.container}>

      {/* Шапка таблицы */}
      <table className={styles._table}>
        <thead>
          <tr>
            <th >{t('bills.date')}</th>
            <th >{t('bills.title')}</th>
            <th >{t('bills.download')}</th>
            <th >{t('bills.paid')}</th>

          </tr>
        </thead>
        <tbody>
          {billsReactNodes}

        </tbody>
      </table>

    </div>
  );
};


