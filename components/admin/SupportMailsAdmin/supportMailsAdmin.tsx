

import React, { useEffect, useState } from 'react';
import styles from "./supportMailsAdmin.module.scss";
import { getSupportMailsAdmin } from '@/services/admin/getSupportMailsAdmin';
import { changeStatusMail } from '@/services/admin/changeStatusMail';
import { sendMail } from '@/services/suport/sendMail'; // отправка писем одинаковая для всех

import { SupportMailItem,StatusEnum } from "@/types/types";
import { useTranslation } from 'react-i18next';
import { SupportMailAdmin } from './SupportMailAdmin/supportMailAdmin';

interface SupportMailsProps {
  setMessage: (message: string) => void,
  userId: number,
  token: string,
}

export const SupportMailsAdmin: React.FC<SupportMailsProps> = ({
  setMessage,
  userId,
  token,
}) => {

  const { t, i18n } = useTranslation();
  const [supportMailsValue, setSupportMailsValue] = useState([] as SupportMailItem[]);
  const [expandValue, setExpandValue] = useState([] as number[]);

  const [showClosed, setShowClosed] = useState(false);
  const [showFixed, setShowFixed] = useState(true);
  
  
    // Хелперы для статусов (подстрахуемся на случай строк)
    const isClosed = (m: SupportMailItem) => m.status === StatusEnum.closed || String(m.status).toLowerCase() === 'closed';
    const isFixed = (m: SupportMailItem) => m.status === StatusEnum.performed || String(m.status).toLowerCase() === 'performed';
  
  // Получаем сообщения
  const getSupportMailsAdminHandler = async () => {
    await getSupportMailsAdmin(userId,token, t,i18n.language, setMessage, setSupportMailsValue);
  };

  useEffect(() => {
    getSupportMailsAdminHandler();
  }, []);

  
const changeStatusMailHandler = async (id: number,status:StatusEnum) => {
    await changeStatusMail(userId,id, status, supportMailsValue, setSupportMailsValue,token, t,i18n.language, setMessage)
  }

  // На клиенте если не записано
  const delMaildmin = (id: number) => {
    const updatedMessages = supportMailsValue.filter(mes => mes.id !== id);
    setSupportMailsValue(updatedMessages);
  };

  // На клиенте
  const answerMailAdmin = (basedOn: number) => {
    const basedOnMessage = supportMailsValue.find(mes => mes.id === basedOn);
    if (!basedOnMessage) return;

    const newMes = {
      id: -Math.abs(Math.random()),
      title: `suport: ${basedOnMessage.title}`,
      body: `suport:\n\n\n -------------------------\n  ${basedOnMessage.body}`,
      userId: userId,
      teamId: basedOnMessage.teamId,
      fromUser: false,
      basedOn: basedOn, // Связь с исходным сообщением
      date: new Date().toLocaleDateString('en-CA'),
    } as SupportMailItem;
    setSupportMailsValue([newMes, ...supportMailsValue]);
    setExpand(newMes.id);
  };

  // На сервере
  //  отправляем сообщение
  const sendMailHandler = async (supportMessage: SupportMailItem) => {

    await sendMail(supportMessage, supportMailsValue, setSupportMailsValue,
      userId, token, t,i18n.language, setMessage, setExpand)

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
  

  // На клиенте
  // Функция для поиска всех сообщений, относящихся к текущему (по basedOn) и с добавлением сдвига
  const findMessagesInChain = (baseMessageId: number, shift: number = 0) => {
    const messages = supportMailsValue.filter(mes => mes.basedOn === baseMessageId);
    messages.sort((a, b) => a.id! - b.id!); // Сортировка по id (возрастание)

    const result = messages.map((message, index) => {
      if (!expandValue.includes(baseMessageId)) return null;
      return (
        <div key={message.id} style={{ marginLeft: `${shift}px` }}>
          <SupportMailAdmin
            supportMessage={message}
            setMessage={setMessage}
            delMailAdmin={delMaildmin}
            answerlMailAdmin={answerMailAdmin}
            sendlMailAdmin={sendMailHandler}
            setExpand={setExpand}
            expand={expandValue.includes(message.id)}
            index={index}
            changeStatusMail={changeStatusMailHandler}

          />
          {findMessagesInChain(message.id, 25)} {/* Рекурсивный вызов для нахождения цепочки сообщений с увеличением сдвига */}
        </div>
      );
    });

    return result;
  };

  // Фильтруем начальные сообщения (где нет basedOn)
  // const topLevelMessages = supportMailsValue.filter(mes => !mes.basedOn);
  // Фильтруем начальные сообщения (где нет basedOn) + применяем чекбоксы
  const topLevelMessages = supportMailsValue.filter(mes => {
    if (mes.basedOn) return false;              // только верхний уровень
    if (!showClosed && isClosed(mes)) return false; // скрыть закрытые, если флаг снят
    if (!showFixed && isFixed(mes)) return false;   // скрыть исправленные, если флаг снят
    return true;
  });

  // Сортируем сообщения: сначала новые сообщения (id < 0), потом по убыванию id для остальных
  topLevelMessages.sort((a, b) => {
    if (a.id! < 0 && b.id! >= 0) return -1;  // Новые сообщения должны быть сверху
    if (a.id! >= 0 && b.id! < 0) return 1;   // Новые сообщения должны быть сверху
    return b.id! - a.id!;  // Для всех остальных сортировка по убыванию id
  });
  const topLevelMessagesReactNodes = topLevelMessages.map((mestop, index) => {
    return (
      <div key={mestop.id}>
        <SupportMailAdmin
          supportMessage={mestop}
          setMessage={setMessage}
          delMailAdmin={delMaildmin}
          answerlMailAdmin={answerMailAdmin}
          sendlMailAdmin={sendMailHandler}
          setExpand={setExpand}
          expand={expandValue.includes(mestop.id)}
          index={index}
          changeStatusMail={changeStatusMailHandler}
          // markProcessedMailAdmin={markProcessedMailAdminHandler}
        />
        {findMessagesInChain(mestop.id, 0)} {/* Рекурсивный вызов для нахождения цепочки сообщений с начальным сдвигом */}
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
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
          />
          {/* <span>{t?.('leads.showSpam') || 'Показывать спам'}</span> */}
          <span>{'Показывать закрытые'}</span>
        </label>

        <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={showFixed}
            onChange={(e) => setShowFixed(e.target.checked)}
          />
          {/* <span>{t?.('leads.showLost') || 'Показывать потерянные'}</span> */}
          <span>{'Показывать исправленные'}</span>
        </label>
      </div>
      
      {topLevelMessagesReactNodes}
    </div>
  );
};
