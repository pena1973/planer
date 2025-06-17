

import React, { useEffect, useState } from 'react';
import styles from "./supportMessages.module.scss";
import { SupportMessageItem } from "@/types";
import { useTranslation } from 'react-i18next';
import { SupportMessage } from './SupportMessage/supportMessage';

interface SupportMessagesProps {
  setMessage: (message: string) => void,
  teamId: number,
  userId: number,
  token: string
}

export const SupportMessages: React.FC<SupportMessagesProps> = ({
  setMessage,
  teamId,
  userId,
  token
}) => {

  const { t, i18n } = useTranslation();
  const [supportMessagesValue, setSupportMessagesValue] = useState([] as SupportMessageItem[]);
  const [expandValue, setExpandValue] = useState([] as number[]);

  // Получаем сообщения
  const getSupportMessages = async () => {
    try {
      const res = await fetch(`api/support-api?userId=${userId}&teamId=${teamId}`, {
        method: 'get',
        headers: new Headers({
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json'
        }),
      });
      if (res.status !== 200) {
        const receivedData = await res.json();
        setMessage(t('service.serverUnavailable') + receivedData.message);
      } else {
        const receivedData = await res.json();
        setMessage(receivedData.message);
        if (receivedData.success) {
          const messages = receivedData.supportMessages as SupportMessageItem[];
          setSupportMessagesValue(messages);
        }
      }
      // } catch (e: any) {
      //   setMessage(t('service.serverUnavailable') + e.message)
      // }
    } catch (e: unknown) {
      let message = t('service.serverUnavailable');
      if (e instanceof Error) {
        message += e.message;
      }
      setMessage(message);
    }

  };
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    getSupportMessages();
  },[] );

  const addSupportMessage = () => {
    const newMes = {
      id: -Math.abs(Math.random()), // Используем отрицательное значение для нового сообщения
      date: new Date().toLocaleDateString('en-CA'),
      title: "",
      body: "",
      userId: userId,
      fromUser: true,
      basedOn: NaN,
    } as SupportMessageItem;
    setSupportMessagesValue([newMes, ...supportMessagesValue]);
    setExpand(newMes.id);
  };

  const delMessage = (id: number) => {
    const updatedMessages = supportMessagesValue.filter(message => message.id !== id);
    setSupportMessagesValue(updatedMessages);
  };

  const answerMessage = (basedOn: number) => {
    const basedOnMessage = supportMessagesValue.find(mes => mes.id === basedOn);
    if (!basedOnMessage) return;

    const newMes = {
      id: -Math.abs(Math.random()),
      date: new Date().toLocaleDateString('en-CA'),
      title: `RE: ${basedOnMessage.title}`,
      body: `RE:\n\n\n -------------------------\n  ${basedOnMessage.body}`,
      userId: userId,
      fromUser: true,
      basedOn: basedOn, // Связь с исходным сообщением
    } as SupportMessageItem;
    setSupportMessagesValue([newMes, ...supportMessagesValue]);
    setExpand(newMes.id);
  };


  //  отправляем сообщение
  const sendMessage = async (supportMessage: SupportMessageItem) => {
    const index = supportMessagesValue.findIndex(mes => mes.id = supportMessage.id)
    if (index < 0) return;

    try {
      const res = await fetch(`api/support-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            userId: userId,
            teamId: teamId,
            supportMessage: supportMessage
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessage(t('service.serverUnavailable') + receivedData.error);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)
        setMessage(receivedData.message);
        if (receivedData.success) {
          // проверили и вернули общий статус карты
          const message = receivedData.supportMessage as SupportMessageItem;
          const messages = [...supportMessagesValue]
          messages.splice(index, 1, message)
          setSupportMessagesValue(messages);
          setExpand(message.id)
        }
      }

      // } catch (e: any) {
      //   setMessage(t('service.serverUnavailable') + e.message)
      // }
    } catch (e: unknown) {
      let message = t('service.serverUnavailable');
      if (e instanceof Error) {
        message += e.message;
      }
      setMessage(message);
    }



  }


  const setExpand = (id: number) => {
    setExpandValue(prevState => {
      if (prevState.includes(id)) {
        return prevState.filter(item => item !== id);
      } else {
        return [...prevState, id];
      }
    });
  };

  // Функция для поиска всех сообщений, относящихся к текущему (по basedOn) и с добавлением сдвига
  const findMessagesInChain = (baseMessageId: number, shift: number = 0) => {
    const messages = supportMessagesValue.filter(mes => mes.basedOn === baseMessageId);
    messages.sort((a, b) => a.id! - b.id!); // Сортировка по id (возрастание)

    const result = messages.map((message, index) => {
      if (!expandValue.includes(baseMessageId)) return null;
      return (
        <div key={message.id} style={{ marginLeft: `${shift}px` }}>
          <SupportMessage
            supportMessage={message}
            setMessage={setMessage}
            delMessage={delMessage}
            answerMessage={answerMessage}
            sendMessage={sendMessage}
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
  const topLevelMessages = supportMessagesValue.filter(mes => !mes.basedOn);

  // Сортируем сообщения: сначала новые сообщения (id < 0), потом по убыванию id для остальных
  topLevelMessages.sort((a, b) => {
    if (a.id! < 0 && b.id! >= 0) return -1;  // Новые сообщения должны быть сверху
    if (a.id! >= 0 && b.id! < 0) return 1;   // Новые сообщения должны быть сверху
    return b.id! - a.id!;  // Для всех остальных сортировка по убыванию id
  });
  const topLevelMessagesReactNodes = topLevelMessages.map((mestop, index) => {
    return (
      <div key={mestop.id}>
        <SupportMessage
          supportMessage={mestop}
          setMessage={setMessage}
          delMessage={delMessage}
          answerMessage={answerMessage}
          sendMessage={sendMessage}
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
