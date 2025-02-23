
import styles from "./settings.module.scss";

import {SettingsItem } from '@/types'
import Image from 'next/image';

import { useEffect, useState, useRef } from "react";

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setUOMs, } from '@/store/slices'

import { setSettings } from '@/store/slices'

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import cancel from "@/public/cancel.png";
import save from "@/public/save-rem.png";


export interface SettingsProps {
    setMessage: (message: string) => void
}

export default function Settings({ setMessage }: SettingsProps) {
    const dispatch = useAppDispatch();

    const settings = useSelector((state: RootState) => {
        return state.catalogSlice.settings;
    })


    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [timeStartWorkValue, setTimeStartWorkValue] = useState(0);
    const [timeFinishWorkValue, setTimeFinishWorkValue] = useState(0);
    const [showWeekendValue, setShowWeekendValue] = useState(true);
    const [showHolidayValue, setShowHolidayValue] = useState(true);

    useEffect(() => {
        setTimeStartWorkValue(settings.timeStartWork);
        setTimeFinishWorkValue(settings.timeFinishWork);
        setShowWeekendValue(settings.showWeekend);
        setShowHolidayValue(settings.showHoliday);
        setModified(false);
        // setMessage("Прочитаны настройки");    
    }, []);

    // колбеки кнопки


    const saveSettingsHandler = async () => {
        setMessage("");
        let settings = {
            timeStartWork: timeStartWorkValue,
            timeFinishWork: timeFinishWorkValue,
            showWeekend: showWeekendValue,
            showHoliday: showHolidayValue,
        }

        // запрос на сохранение
        try {
            // запрос получение текста из БД вместе со словами     textId: number, userId:number
            const res = await fetch(`api/settings-api?userId=${1}&companyId=${1}`,
                {
                    method: 'post',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        settings: settings,
                    }),
                }
            );
            if (res.status !== 200) {
                const receivedData = await res.json();
                let error = receivedData.error;
                setMessage(error);
                //  console.log(t('service.serverUnavailable') + res.status);
                // setMessage(t('service.serverUnavailable') + res.status);
            } else {
                const receivedData = await res.json();
                console.log("receivedData", receivedData)

                if (receivedData.success) {
                    //   Обновим текущую карту
                    let settings = receivedData.schedule as SettingsItem
                    dispatch(setSettings(settings));                  
                    setTimeStartWorkValue(settings.timeStartWork);
                    setTimeFinishWorkValue(settings.timeFinishWork);
                    setShowWeekendValue(settings.showWeekend);
                    setShowHolidayValue(settings.showHoliday);
                    setModified(false);
                    setMessage("Обновлены настройки");
                } else setMessage(receivedData.error);
            }

        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
        }

        setModified(false);
    };

    const cancelScheduleHandler = () => {
      
        setModified(false)
    };


    const changeHandler = (value: string | number, field: string) => {

        switch (field) {

            case "timeStart":
                setTimeStartWorkValue(value as number);
                break;
            case "timeFinish":
                setTimeFinishWorkValue(value as number);
                break;
            default:
                break;
        }

        setModified(true);
    };
   


    return (
        <div className={styles.container_schedule}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelScheduleHandler() }}
            />

            <div className={styles.field_container}>
                <div className={styles.title}>Показывать время </div>
                &nbsp;
                <div className={styles.time_container} >
                    <div className={styles.input_container}>
                        <div className={styles.time_top}>Начало</div>
                        <input
                            className={styles.time_input}
                            id="timeStart"
                            autoComplete="off"
                            value={timeStartWorkValue !== undefined
                                ? `${String(Math.floor(timeStartWorkValue / 60)).padStart(2, '0')}:${String(timeStartWorkValue % 60).padStart(2, '0')}`
                                : ""}
                            type="time"
                            onChange={e => {
                                setModified(true);
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                                changeHandler(totalMinutes, "timeStart");
                            }}
                        />
                    </div>
                    <div className={styles.input_container}>
                        <div className={styles.time_top}>Конец</div>
                        <input
                            className={styles.time_input}
                            id="timeFinish"
                            autoComplete="off"
                            value={timeFinishWorkValue !== undefined
                                ? `${String(Math.floor(timeFinishWorkValue / 60)).padStart(2, '0')}:${String(timeFinishWorkValue % 60).padStart(2, '0')}`
                                : ""}
                            type="time"
                            onChange={e => {
                                setModified(true);
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                                changeHandler(totalMinutes, "timeFinish");
                            }}
                        />
                    </div>



                </div>
            </div>


            <div className={styles.field_container}>
                <div className={styles.title}>Показывать выходные</div>
                <div className={styles.input_container}>
                    <input
                        className={styles.time_input}
                        id="showWeekend"
                        autoComplete="off"
                        checked={showWeekendValue}
                        type="checkbox"
                        onChange={e => {
                            setModified(true);
                            setShowWeekendValue(!showWeekendValue)
                        }}
                    />
                </div>
            </div>

            <div className={styles.field_container}>
                <div className={styles.title}>Показывать праздники</div>
                <div className={styles.input_container}>
                    <input
                        className={styles.time_input}
                        id="showWeekend"
                        autoComplete="off"
                        checked={showHolidayValue}
                        type="checkbox"
                        onChange={e => {
                            setModified(true);
                            setShowHolidayValue(!showHolidayValue)
                        }}
                    />
                </div>
            </div>
            <div className={styles.container_buttons_row}>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => { saveSettingsHandler() }}
                    />
                    {modified && <div>*</div>}
                </div>

            </div>
        </div>


    )
}