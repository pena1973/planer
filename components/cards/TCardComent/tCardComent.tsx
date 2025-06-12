
import styles from "./tCardComent.module.scss";

import { useEffect, useState, useRef } from "react";

// const URL = process.env.NEXT_PUBLIC_URL;
// let _url = String(URL);
// _url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");


export interface TCardComentProps {
    coment: string,
    setComentTCardHandler: (coment: string) => void,
    tCardIdc: number,
}

export default function TCardComent({
    coment,
    setComentTCardHandler,
    tCardIdc
}: TCardComentProps) {
 

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
    }, [coment]); // Каждый раз, когда изменяется содержимое, высота будет пересчитана

    return (

        <div className={styles.container}>

            <textarea
                ref={textareaRef}  // Привязываем ссылку
                className={styles.coment_input}
                id={"coment-" + tCardIdc}
                autoComplete="off"
                value={coment}
                onChange={e => { setComentTCardHandler(e.target.value) }}
            />

        </div>



    )
}