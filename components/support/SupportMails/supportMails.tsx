

import React, { useEffect, useState } from 'react';
import styles from "./supportMails.module.scss";
import { getSupportMails } from '@/services/suport/getSupportMails';
import { sendMail } from '@/services/suport/sendMail';


import { SupportMailItem } from "@/types/types";
import { useTranslation } from 'react-i18next';
import { SupportMail } from './SupportMail/supportMail';

import { getCurrentDateInString, getTimeZoneDateFromDateString } from "@/lib/client/timezone.client"

interface SupportMailsProps {
  setMessage: (message: string) => void,
  teamId: number,
  userId: number,
  token: string,
  timezone: string
}

export const SupportMails: React.FC<SupportMailsProps> = ({
  setMessage,
  teamId,
  userId,
  token,
  timezone
}) => {

  const { t, i18n } = useTranslation();
  const [supportMailsValue, setSupportMailsValue] = useState([] as SupportMailItem[]);
  const [expandValue, setExpandValue] = useState([] as number[]);

  // На сервере
  // Получаем сообщения
  const getSupportMessagesHandler = async () => {
    await getSupportMails(userId, token, t, setMessage, setSupportMailsValue);

  };

  useEffect(() => {
    getSupportMessagesHandler();
  }, []);

  // На клиенте
  const addSupportMessage = () => {
    const newMes = {
      id: -Math.abs(Math.random()), // Используем отрицательное значение для нового сообщения
      date: new Date().toLocaleDateString('en-CA'),
      title: "",
      body: "",
      userId: userId,
      fromUser: true,
      basedOn: NaN,
      processed:false,
      teamId:teamId
    } as SupportMailItem;
    setSupportMailsValue([newMes, ...supportMailsValue]);
    setExpand(newMes.id);
  };

  // На клиенте
  const delMailHandler = (id: number) => {
    const updatedMessages = supportMailsValue.filter(mes => mes.id !== id);
    setSupportMailsValue(updatedMessages);
  };

  // На клиенте
  const answerMailHandler = (basedOn: number) => {
    const basedOnMessage = supportMailsValue.find(mes => mes.id === basedOn);
    if (!basedOnMessage) return;

    const newMes = {
      id: -Math.abs(Math.random()),
      date: getCurrentDateInString(timezone),
      // date: new Date().toLocaleDateString('en-CA'),
      title: `RE: ${basedOnMessage.title}`,
      body: `RE:\n\n\n -------------------------\n  ${basedOnMessage.body}`,
      userId: userId,
      fromUser: true,
      basedOn: basedOn, // Связь с исходным сообщением
      processed:false,
      teamId:teamId
    } as SupportMailItem;
    setSupportMailsValue([newMes, ...supportMailsValue]);
    setExpand(newMes.id);
  };

  // На сервере
  //  отправляем сообщение
  const sendMailHandler = async (supportMessage: SupportMailItem) => {

    await sendMail(supportMessage, supportMailsValue, setSupportMailsValue,
      userId, token, t, setMessage, setExpand)

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
          <SupportMail
            supportMessage={message}
            setMessage={setMessage}
            delMail={delMailHandler}
            answerMail={answerMailHandler}
            sendMail={sendMailHandler}
            setExpand={setExpand}
            teamId={teamId}
            userId={userId}
            expand={expandValue.includes(message.id)}
            index={index}

          />
          {findMessagesInChain(message.id, 25)} {/* Рекурсивный вызов для нахождения цепочки сообщений с увеличением сдвига */}
        </div>
      );
    });

    return result;
  };

  // Фильтруем начальные сообщения (где нет basedOn)
  const topLevelMessages = supportMailsValue.filter(mes => !mes.basedOn);

  // Сортируем сообщения: сначала новые сообщения (id < 0), потом по убыванию id для остальных
  topLevelMessages.sort((a, b) => {
    if (a.id! < 0 && b.id! >= 0) return -1;  // Новые сообщения должны быть сверху
    if (a.id! >= 0 && b.id! < 0) return 1;   // Новые сообщения должны быть сверху
    return b.id! - a.id!;  // Для всех остальных сортировка по убыванию id
  });
  const topLevelMessagesReactNodes = topLevelMessages.map((mestop, index) => {
    return (
      <div key={mestop.id}>
        <SupportMail
          supportMessage={mestop}
          setMessage={setMessage}
          delMail={delMailHandler}
          answerMail={answerMailHandler}
          sendMail={sendMailHandler}
          setExpand={setExpand}
          teamId={teamId}
          userId={userId}
          expand={expandValue.includes(mestop.id)}
          index={index}
        />
        {findMessagesInChain(mestop.id, 0)} {/* Рекурсивный вызов для нахождения цепочки сообщений с начальным сдвигом */}
      </div>
    );
  });

  return (
    <div className={styles.container}>
      <button onClick={addSupportMessage}>{t('support.new')}</button>
      {topLevelMessagesReactNodes}
    </div>
  );
};
