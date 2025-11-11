

import React, { useEffect, useState, useMemo } from 'react';
import styles from "./leads.module.scss";
import { getLeads } from '@/services/admin/getLeads';
import { updateLead } from '@/services/admin/updateLead';


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
  const [leadsValue, setLeadsValue] = useState([] as LeadItem[]);
  const [expandValue, setExpandValue] = useState([] as number[]);
  const [showSpam, setShowSpam] = useState(false);
  const [showLost, setShowLost] = useState(false);

  // Получаем сообщения
  const getLeadsHandler = async () => {
    await getLeads(userId, token, t, i18n.language, setMessage, setLeadsValue);

  };

  useEffect(() => {
    getLeadsHandler();
  }, []);


  const changeStatusLeadHandler = async (id: number, status: LeadStatus) => {
    await updateLead(userId, id, status, null, leadsValue, setLeadsValue, token, t, i18n.language, setMessage)
  }

  const saveNotesHandler = async (id: number, notes: string) => {
    await updateLead(userId, id, null, notes, leadsValue, setLeadsValue, token, t, i18n.language, setMessage)

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

  // Фильтрация по статусу
  const filteredLeads = useMemo(() => {
    return leadsValue.filter(lead => {
      const s = String(lead.status ?? '').toLowerCase();
      if (!showSpam && s === 'spam') return false;
      if (!showLost && (s === 'lost' || s === 'lose' || s === 'losted')) return false; // подстраховка по возможным именам
      return true;
    });
  }, [leadsValue, showSpam, showLost]);

  const leadsValueReactNodes = filteredLeads.map((lead, index) => {
    return (
      <div key={lead.id}>
        <Lead
          lead={lead}
          setMessage={setMessage}
          setExpand={setExpand}
          expand={expandValue.includes(lead.id ?? 0)}
          index={index}
          changeStatusLead={changeStatusLeadHandler}
          saveNotes={saveNotesHandler}
        />
      </div>
    );
  });

  return (

    <div className={styles.container}>

      {/* Фильтры над списком */}
      <div className={styles.filters} style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={showSpam}
            onChange={(e) => setShowSpam(e.target.checked)}
          />
          {/* <span>{t?.('leads.showSpam') || 'Показывать спам'}</span> */}
          <span>{'Показывать спам'}</span>
        </label>

        <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={showLost}
            onChange={(e) => setShowLost(e.target.checked)}
          />
          {/* <span>{t?.('leads.showLost') || 'Показывать потерянные'}</span> */}
          <span>{'Показывать потерянные'}</span>
        </label>
      </div>

      {leadsValueReactNodes}
    </div>
  );
};
