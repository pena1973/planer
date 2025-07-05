
import React, { useEffect, useState, useRef } from 'react';
import styles from "./billing.module.scss";
import { getBills } from '@/services/suport/getBills';
import { BillItem } from "@/types/types";
import { useTranslation } from 'react-i18next';
import Image from 'next/image';


import download from "@/public/download2-rem.png";


interface BillingProps {
  setMessage: (message: string) => void,
  teamId: number,
  userId: number,
  token: string
}

export const Billing: React.FC<BillingProps> = ({
  setMessage,
  teamId,
  userId,
  token
}) => {

  const { t, i18n } = useTranslation();
  const [billsValue, setBillsValue] = useState([] as BillItem[]); // переключатель между каталогами

  // На сервере
  // Меняем статус операции по нажатию кенопки юнитом 
  const getBillsHandler = async () => {
    await getBills(userId, teamId, token, t, setMessage, setBillsValue);

  }
  const downloadFile = (bill: BillItem) => { }

  const billsReactNodes = billsValue.map((bill, index) => {
    return (<tr key={index}>
      <td> {bill.date}</td>
      <td> {bill.title}</td>
      <td>  <Image className={styles.icon_bill}
        src={download}
        alt="arrow" width={20} height={20}
        onClick={e => downloadFile(bill)}
      /> </td>
      <td>{bill.paid}</td>
    </tr>)
  })


  useEffect(() => {
    getBillsHandler();
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


