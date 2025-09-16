
import React, { useEffect, useState, useRef } from 'react';
import styles from "./supportMailAdmin.module.scss";
import { SupportMailItem } from "@/types/types";

import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import Image from 'next/image';
import next from "@/public/next-rem.png";
import del from "@/public/del2-rem.png";
import galka_vniz from "@/public/galka_vniz-rem.png";
import galka_vpravo from "@/public/galka_vpravo-rem.png";

import { useTranslation } from 'react-i18next';

interface SupportMailProps {
  supportMessage: SupportMailItem,
  setMessage: (message: string) => void, // Это диагностика
  delMailAdmin: (id: number) => void,
  answerlMailAdmin: (basedOn: number) => void,
  sendlMailAdmin: (supportMessageValue: SupportMailItem) => Promise<void>,
  setExpand: (id: number) => void,
  markProcessedMailAdmin:(id:number) => void,
  index: number,
  expand: boolean,

}

export const SupportMailAdmin: React.FC<SupportMailProps> = ({
  supportMessage,
  delMailAdmin,
  answerlMailAdmin,
  sendlMailAdmin,
  setExpand,
  markProcessedMailAdmin,
  index,
  expand,

}) => {

  const { t } = useTranslation();
  const [supportMessageValue, setSupportMessageValue] = useState({} as SupportMailItem); // переключатель между каталогами

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
    await sendlMailAdmin(supportMessageValue)
    setButtonLoader(false);

  }

  return (<>
    {/* {(expand || (!supportMessageValue.basedOn)) && */}
    <div className={styles.container}>
      {(!supportMessageValue.basedOn) && !supportMessageValue.processed && <button className={styles.button_mark}
        onClick={e => { markProcessedMailAdmin(supportMessageValue.id) }}>
        {t('support.processed')}
      </button>}

      {!(!supportMessageValue.basedOn) &&
        <Image className={styles.icon_next}
          src={next}
          alt="arrow" width={20} height={20}
        />}
      <div className={styles.message_container}>
        <div className={`${styles.header} ${isNew ? styles.new : ''}`}>
          <div className={`${styles.header_groupe} ${isNew ? styles.new : ''}`}>
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
                className={`${styles.title_input} ${isNew ? styles.new : ''}`}
                placeholder='Тема'
                id={"title" + index}
                autoComplete="off"
                value={supportMessageValue.title}
                onChange={e => { setTitleHandler(e.target.value) }}
              />}
          </div>
          <div className={styles.header_groupe_id}>
            <div className={styles.id}>ID#:{(supportMessage.id > 0) ? supportMessage.id : t('support.new')}</div>
            <div className={styles.date}>{supportMessage.date}</div>
          </div>
        </div>

        {expand &&
          <textarea
            ref={textareaRef}  // Привязываем ссылку
            placeholder='Текст письма'
            className={`${styles.body_input} ${isNew ? styles.new : ''}`}
            id={"body" + index}
            autoComplete="off"
            value={supportMessageValue.body}
            onChange={e => { if (isNew) setbodyHandler(e.target.value) }}
          />}

        {(isNew || expand) && <div className={styles.footer}>
          {isNew && <Image className={styles.icon_del}
            src={del}
            alt="arrow" width={20} height={20}
            onClick={e => { delMailAdmin(supportMessageValue.id) }}
          />}
          <div></div>

          {supportMessageValue.id < 0 &&
            <button className={styles.button_send}
              onClick={e => { send() }}>
              {buttonLoader && <ButtonLoader />}
              {!buttonLoader && t('support.send')}
            </button>}
          {supportMessageValue.id > 0
            && <button className={styles.button_send}
              onClick={e => { answerlMailAdmin(supportMessageValue.id) }}>
              {t('support.reply')}
            </button>}

        </div>}

      </div>
    </div>
    {/* } */}
  </>
  );
};


