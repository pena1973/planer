
import React, { useEffect, useState, useRef } from 'react';
import styles from "./supportMessage.module.scss";
import { SupportMessageItem } from "@/types";

import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import Image from 'next/image';
import next from "@/public/next-rem.png";
import del from "@/public/del2-rem.png";
import galka_vniz from "@/public/galka_vniz-rem.png";
import galka_vpravo from "@/public/galka_vpravo-rem.png";

import { useTranslation } from 'react-i18next';

interface SupportMessageProps {
  supportMessage: SupportMessageItem,
  setMessage: (message: string) => void, // Это диагностика
  delMessage: (id: number) => void,
  answerMessage: (basedOn: number) => void,
  sendMessage: (supportMessageValue: SupportMessageItem) => Promise<void>,
  setExpand: (id: number) => void,
  teamId: number,
  userId: number,
  index: number,
  expand: boolean,

}

export const SupportMessage: React.FC<SupportMessageProps> = ({
  supportMessage,
  setMessage,
  delMessage,
  answerMessage,
  sendMessage,
  setExpand,
  teamId,
  userId,
  index,
  expand,

}) => {

  const { t, i18n } = useTranslation();
  const [supportMessageValue, setSupportMessageValue] = useState({} as SupportMessageItem); // переключатель между каталогами

  const [buttonLoader, setButtonLoader] = useState(false);

  const isNew = (supportMessage.id < 0);

  useEffect(() => {
    setSupportMessageValue(supportMessage);
  }, [supportMessage]);

  useEffect(() => {
    if (expand) {
      adjustHeight();
    }
  }, [expand]); // Зависимость от expand и содержимого


  const setbodyHandler = (body: string) => {
    setSupportMessageValue({ ...supportMessageValue, body: body })
  }
  const setTitleHandler = (title: string) => {
    setSupportMessageValue({ ...supportMessageValue, title: title })
  }

  // Функция для автоматической подгонки высоты
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Функция для автоматической подгонки высоты
  const adjustHeight = () => {
    if (textareaRef.current) {
      // Сбрасываем высоту до авто, чтобы она подстраивалась под содержимое
      textareaRef.current.style.height = 'auto';

      // Если высота содержимого меньше или равна 100px, подстраиваем высоту
      if (textareaRef.current.scrollHeight <= 300) {
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;  // Устанавливаем высоту в зависимости от содержимого
        textareaRef.current.style.overflowY = 'hidden';  // Убираем прокрутку, когда высота меньше 100px
      } else {
        // Когда содержимое превышает 100px, фиксируем высоту на 100px и включаем прокрутку
        textareaRef.current.style.height = '300px';
        textareaRef.current.style.overflowY = 'auto';  // Включаем вертикальную прокрутку
      }
    }
  };

  // Подстраиваем высоту после рендера или изменения содержимого
  useEffect(() => {
    adjustHeight();
  }, [supportMessageValue]); // Каждый раз, когда изменяется содержимое, высота будет пересчитана

  const send = async () => {
    setButtonLoader(true);
    await sendMessage(supportMessageValue)
    setButtonLoader(false);

  }

  return (<>
    {/* {(expand || (!supportMessageValue.basedOn)) && */}
    <div className={styles.container}>
      {!(!supportMessageValue.basedOn) &&
        <Image className={styles.icon_next}
          src={next}
          alt="arrow" width={20} height={20}
        />}
      <div className={styles.message_container}>
        <div className={styles.header}>
          <div className={styles.header_groupe}>
            {!isNew && expand &&
              <Image className={styles.icon_galka}
                src={galka_vniz}
                alt="arrow" width={20} height={20}
                onClick={e => setExpand(supportMessageValue.id)}
              />}
            {!isNew && !expand &&
              <Image className={styles.icon_galka}
                src={galka_vpravo}
                alt="arrow" width={20} height={20}
                onClick={e => setExpand(supportMessageValue.id)}
              />}
            {!isNew && <div >{supportMessage.title}</div>}
            {isNew &&
              <input
                className={styles.title_input}
                placeholder='Тема'
                id={"title" + index}
                autoComplete="off"
                value={supportMessageValue.title}
                onChange={e => { setTitleHandler(e.target.value) }}
              />}
          </div>
          <div className={styles.header_groupe_id}>
            <div className={styles.id}>ID#:{(supportMessage.id > 0) ? supportMessage.id : " new"}</div>
            <div className={styles.date}>{supportMessage.date}</div>
          </div>
        </div>

        {expand &&
          <textarea
            ref={textareaRef}  // Привязываем ссылку
            placeholder='Текст письма'
            className={styles.body_input}
            id={"body" + index}
            autoComplete="off"
            value={supportMessageValue.body}
            onChange={e => { if (isNew) setbodyHandler(e.target.value) }}
          />}

        {(isNew || expand) && <div className={styles.footer}>
          {isNew && <Image className={styles.icon_del}
            src={del}
            alt="arrow" width={20} height={20}
            onClick={e => { delMessage(supportMessageValue.id) }}
          />}
          <div></div>

          {supportMessageValue.id < 0 &&
            <button className={styles.button_send} 
            onClick={e => { send() }}>
              {buttonLoader && <ButtonLoader />}
              {!buttonLoader && "Отправить"}
            </button>}
          {supportMessageValue.id > 0 && <button onClick={e => { answerMessage(supportMessageValue.id) }}>Ответить</button>}

        </div>}

      </div>
    </div>
    {/* } */}
  </>
  );
};


