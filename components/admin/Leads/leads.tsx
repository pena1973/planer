

import React, { useEffect, useState } from 'react';
import styles from "./leads.module.scss";
import { getLeads } from '@/services/landing/getLeads';
import { changeStatusLead } from '@/services/admin/changeStatuslead';

import { LeadItem, LeadSource, LeadStatus } from "@/types/leads-types";
import { useTranslation } from 'react-i18next';
import { Lead } from './Lead/lead';

interface LeadsProps {
  setMessage: (message: string) => void,
  userId: number,
  token: string,
}

export const Leads: React.FC<LeadsProps> = ({
  setMessage,
  userId,
  token,
}) => {

  const { t, i18n } = useTranslation();
  // const [supportMailsValue, setSupportMailsValue] = useState([] as SupportMailItem[]);
  const [leadsValue, setLeadsValue] = useState([] as LeadItem[]);
  const [expandValue, setExpandValue] = useState([] as number[]);


  // Получаем сообщения
  const getLeadsHandler = async () => {
    await getLeads(userId, token, t, i18n.language, setMessage, setLeadsValue);
    // Сортируем сообщения: сначала новые сообщения (id < 0), потом по убыванию id для остальных
    leadsValue.sort((a, b) => {
      if (a.id! < 0 && b.id! >= 0) return -1;  // Новые сообщения должны быть сверху
      if (a.id! >= 0 && b.id! < 0) return 1;   // Новые сообщения должны быть сверху
      return b.id! - a.id!;  // Для всех остальных сортировка по убыванию id
    });
  };

  useEffect(() => {
    getLeadsHandler();
  }, []);


  const changeStatusLeadHandler = async (id: number, status: LeadStatus) => {
    await changeStatusLead(userId, id, status, leadsValue, setLeadsValue, token, t, i18n.language, setMessage)
  }



  // На клиенте
  const setExpand = (id: number) => {
    setExpandValue(prevState => {
      if (prevState.includes(id)) {
        return prevState.filter(item => item !== id);
      } else {
        return [...prevState, id];
      }
    });
  };


  const leadsValueReactNodes = leadsValue.map((lead, index) => {
    return (
      <div key={lead.id}>
        <Lead
          lead={lead}
          setMessage={setMessage}                    
          setExpand={setExpand}
          expand={expandValue.includes(lead.id??0)}
          index={index}
          changeStatusLead={changeStatusLeadHandler}        
        />        
      </div>
    );
  });

  return (
    <div className={styles.container}>      
      {leadsValueReactNodes}
    </div>
  );
};
