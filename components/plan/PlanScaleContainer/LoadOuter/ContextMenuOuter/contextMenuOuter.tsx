
import styles from "./contextMenuOuter.module.scss";
import { padNumberToFourDigits, } from "@/lib/utils"
import Image from 'next/image';
import { useEffect, useState, useRef } from "react";

import eraz from "@/public/erazer1-rem.png";
import save from "@/public/save-rem.png";
import { StatusEnum, TCardItem, UnitLoadItem, } from "@/types/types";
import { useTranslation } from 'react-i18next';

export interface ContexMenuOuterProps {
    tCard: TCardItem,
    load: UnitLoadItem,
    left: number,
    erazLoadHandler: (load_idc: number) => void,
    saveLoadHandler: (
        load: UnitLoadItem,
        dateValue: string,
        timeStartValue: number,
        timeFinisValue: number) => void,
    stopCloseMenu: (idc: number) => void,
    retool: number,
}

export default function ContexMenuOuter({
    tCard,
    load,
    left,
    erazLoadHandler,
    saveLoadHandler,
    stopCloseMenu,
    retool,

}: ContexMenuOuterProps) {
    const { t, i18n } = useTranslation();

    const [timeStartValue, setTimeStartValue] = useState(0);
    const [timeFinisValue, setTimeFinishValue] = useState(0);
    const [dateValue, setDateValue] = useState("");
    const [isModified, setIsModified] = useState(false);

    const width = 10; // в случае внешнего исполнителя лоад просто точка    
  
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setTimeFinishValue(load.timeFinish)
        setTimeStartValue(load.timeStart);
        setDateValue(load.date);
    }, []);

    function convertMinutes(totalMinutes: number): { hours: number; minutes: number } {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return { hours, minutes };
    }
    // const dur1 = load.isRetool ? retool : load.loadInfo.duration;

    const dur = Math.round(load.loadInfo.duration);

    const time = convertMinutes(dur);


    return (
        <div className={styles.container_context_menu}

            style={{ left: `${left + width - width / 2 - 10}px` }} >
            {/* Треугольник (стрелка) */}
            <div className={styles.contextMenuTriangle} />


            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuO.card')}</span> {`: ${padNumberToFourDigits(tCard.idc)} - ${new Date(tCard.date).toLocaleDateString("en-CA")}`}
            </div>

            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuO.action')}</span> {`: A${load.idc_oper} (${load.isRetool ? "retool" : load.loadInfo?.title})`}
            </div>
            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuO.duration')}</span> {`: ${dur} min (${time.hours} h, ${time.minutes} m)`}
            </div>

            {load.isOuterStart &&
                <div className={styles.coment}
                    onClick={e =>
                        stopCloseMenu(load.idc)}>
                    <span className={styles.title}>{t('contexMenuO.dateStart')}</span>

                    {(load.status === StatusEnum.prepared) &&
                        <input
                            className={styles.work_date}
                            id={`isOuterFinish`}
                            autoComplete="off"
                            value={dateValue}
                            type="date"

                            onChange={e => {
                                const date = e.target.value.toLocaleString().split(',')[0]
                                setDateValue(date);
                                setIsModified(true);
                            }}

                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const nextElem = document.getElementById("isOuterTimeStart");
                                    nextElem?.focus();
                                }
                            }}
                        />}
                    &nbsp; &nbsp;{(load.status !== StatusEnum.prepared) && dateValue}
                </div>}

            {load.isOuterStart &&
                <div className={styles.coment}
                    onClick={e => stopCloseMenu(load.idc)}>
                    <span className={styles.title}>{t('contexMenuO.timeStart')}</span>
                    {(load.status === StatusEnum.prepared) &&
                        <input
                            className={styles.work_time}
                            id={`isOuterTimeStart`}
                            autoComplete="off"
                            value={
                                `${String(Math.floor(timeStartValue / 60)).padStart(2, '0')}:${String(timeStartValue % 60).padStart(2, '0')}`
                            }
                            type="time"
                            onChange={e => {
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                                setTimeStartValue(totalMinutes);
                                setIsModified(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const nextElem = document.getElementById("save_icon");
                                    nextElem?.focus();
                                }
                            }}
                        />}
                    &nbsp; &nbsp;{(load.status !== StatusEnum.prepared) && `${String(Math.floor(timeStartValue / 60)).padStart(2, '0')}:${String(timeStartValue % 60).padStart(2, '0')}`}
                </div>}


            {/* // тут инпут и замееки */}
            {load.isOuterFinish &&
                <div className={styles.coment}
                    onClick={e =>
                        stopCloseMenu(load.idc)}>
                    <span className={styles.title}>{t('contexMenuO.dateFinish')}</span>
                    {(load.status === StatusEnum.prepared) &&
                        <input
                            className={styles.work_date}
                            id={`isOuterFinish`}
                            autoComplete="off"
                            value={dateValue}
                            type="date"
                            onChange={e => {
                                const date = e.target.value.toLocaleString().split(',')[0]
                                setDateValue(date);
                                setIsModified(true);
                            }}

                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const nextElem = document.getElementById("isOuterTimeFinish");
                                    nextElem?.focus();
                                }
                            }}

                        />}
                    &nbsp; &nbsp;{(load.status !== StatusEnum.prepared) && dateValue}
                </div>}

            {load.isOuterFinish &&
                <div className={styles.coment}
                    onClick={e => stopCloseMenu(load.idc)}>
                    <span className={styles.title}>{t('contexMenuO.timeFinish')}</span>
                    {(load.status === StatusEnum.prepared) &&
                        <input
                            className={styles.work_time}
                            id={`isOuterTimeFinish`}
                            autoComplete="off"
                            value={
                                `${String(Math.floor(timeFinisValue / 60)).padStart(2, '0')}:${String(timeFinisValue % 60).padStart(2, '0')}`
                            }
                            type="time"
                            onChange={e => {
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                                setTimeFinishValue(totalMinutes);
                                setIsModified(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const nextElem = document.getElementById("save_icon");
                                    nextElem?.focus();
                                }
                            }}
                        />}
                    &nbsp; &nbsp;{(load.status !== StatusEnum.prepared) && `${String(Math.floor(timeFinisValue / 60)).padStart(2, '0')}:${String(timeStartValue % 60).padStart(2, '0')}`}
                </div>}

            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuO.status')}</span> {`: ${load.status}`}
            </div>



            {/* <button> стереть</button> */}
            <div className={styles.container_icon}>

                <div className={styles.save_container_icon}>
                    {(load.status === StatusEnum.prepared) && <Image className={styles.icon_edit_save}
                        id={"save_icon"}
                        src={save}
                        alt="save" width={20} height={20}
                        onClick={() => {
                            setIsModified(false);
                            saveLoadHandler(
                                load,
                                dateValue,
                                timeStartValue,
                                timeFinisValue
                            )
                        }}
                    />}
                    {isModified && <div>*</div>}
                </div>
                <Image className={styles.icon_edit_save}
                    src={eraz}
                    alt="eraz" width={20} height={20}
                    onClick={() => erazLoadHandler(load.idc)}
                />
            </div>

        </div>
    )
}