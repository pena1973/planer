
import React, { useEffect, useState, useRef } from 'react';
import styles from "./lead.module.scss";
import { LeadItem, LeadSource, LeadStatus } from "@/types/leads-types";
import { StatusEnum } from "@/types/types";
import { StatusCircle } from "@/components/StatusCircle/statusCircle";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import Image from 'next/image';
import next from "@/public/next-rem.png";
import del from "@/public/del2-rem.png";
import galka_vniz from "@/public/galka_vniz-rem.png";
import galka_vpravo from "@/public/galka_vpravo-rem.png";

import { useTranslation } from 'react-i18next';

interface LeadProps {
  lead: LeadItem,
  setMessage: (message: string) => void, // Это диагностика  
  setExpand: (id: number) => void,
  changeStatusLead: (id: number, status: LeadStatus) => void,
  index: number,
  expand: boolean,

}

export const Lead: React.FC<LeadProps> = ({
  lead,
  setMessage,
  setExpand,
  changeStatusLead,
  index,
  expand,

}) => {

  const { t } = useTranslation();
  const [leadValue, setLeadValue] = useState({} as LeadItem);
  const [buttonLoader, setButtonLoader] = useState(false);


  useEffect(() => {
    setLeadValue(lead);
  }, [lead]);

  useEffect(() => {
    if (expand) {
      adjustHeight();
    }
  }, [expand]); // Зависимость от expand и содержимого



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
  }, [leadValue]); // Каждый раз, когда изменяется содержимое, высота будет пересчитана

  const viewStatus = (() => {
    switch (leadValue.status) {
      case "new":
        return StatusEnum.planed;
      case "contacted":
        return StatusEnum.performed;
      case "qualified":
        return StatusEnum.ready;
      case "lost":
        return StatusEnum.defective;
      default:
        return StatusEnum.cancelled;
    }
  })();

  return (<>

    <div className={styles.container}>


      <div className={styles.left_container}>
        {leadValue.status === "new" &&
          <div className={styles.buttons_container}>
            <div className={styles.status_container}>
              <StatusCircle status={viewStatus} />
            </div>
            <button className={styles.button_mark}
              onClick={e => { changeStatusLead(leadValue.id ?? 0, "contacted") }}>
              Контакт
            </button>
            <button className={styles.button_mark}
              onClick={e => { changeStatusLead(leadValue.id ?? 0, "spam") }}>
              Спам
            </button>
          </ div>}
        {expand &&
          <textarea
            ref={textareaRef}  // Привязываем ссылку
            placeholder='Текст письма'
            className={styles.body_input}
            id={"body" + index}
            autoComplete="off"
            value={leadValue.message}
          />}
      </div>


      {leadValue.status === "contacted" &&
        <>
          <div className={styles.status_container}>
            <StatusCircle status={viewStatus} />
          </div>
          <button className={styles.button_mark}
            onClick={e => { changeStatusLead(leadValue.id ?? 0, "qualified") }}>
            успех
          </button>
          <button className={styles.button_mark}
            onClick={e => { changeStatusLead(leadValue.id ?? 0, "lost") }}>
            потерян
          </button>
        </>

      }

      <div className={styles.message_container}>

        <div className={styles.header_groupe}>
          {expand &&
            <Image className={styles.icon_galka}
              src={galka_vniz}
              alt="arrow" width={20} height={20}
              onClick={e => setExpand(leadValue.id ?? 0)}
            />}
          {!expand &&
            <Image className={styles.icon_galka}
              src={galka_vpravo}
              alt="arrow" width={20} height={20}
              onClick={e => setExpand(leadValue.id ?? 0)}
            />}


          <div >{leadValue.name} </div>,&nbsp;  &nbsp;<div >{leadValue.email}</div>

        </div>


        {expand && <>
          <div className={styles.header_groupe_id}>
            <div>Дата:{leadValue.date}</div>, &nbsp;&nbsp;  <div> Компания:{leadValue.company}</div>
          </div>

          <textarea
            ref={textareaRef}  // Привязываем ссылку
            placeholder='Текст письма'
            className={styles.body_input}
            id={"body" + index}
            autoComplete="off"
            value={leadValue.message}
          /></>}


      </div>

    </div>

  </>
  );
};


