
import styles from "./systemSettings.module.scss";

import {SettingsItem } from '@/types'
import Image from 'next/image';

import { useEffect, useState, useRef } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";


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
    const [isQualControlValue, setIsQualControlValue] = useState(true);
    // const [showHolidayValue, setShowHolidayValue] = useState(true);

    useEffect(() => {        
        setIsQualControlValue(settings.isQualControl);
        setModified(false);
        
    }, []);

    // колбеки кнопки


    const saveSettingsHandler = async () => {
        setMessage("");
        let settings_ = {...settings, isQualControl: isQualControlValue,}

        // запрос на сохранение
        try {
            // запрос получение текста из БД вместе со словами     textId: number, userId:number
            const res = await fetch(`api/settings-api?userId=${1}&teamId=${1}`,
                {
                    method: 'post',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        settings: settings_,
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
                // console.log("receivedData", receivedData)

                if (receivedData.success) {
                    //   Обновим настройки
                    dispatch(setSettings(receivedData.settings as SettingsItem));                                      
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


    return (
        <div className={styles.container_schedule}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelScheduleHandler() }}
            />

            <div className={styles.field_container}>
                <div className={styles.title}>Контроль качества (ОТК)</div>
                <div className={styles.input_container}>
                    <input
                        className={styles.time_input}
                        id="showWeekend"
                        autoComplete="off"
                        checked={isQualControlValue}
                        type="checkbox"
                        onChange={e => {
                            setModified(true);
                            setIsQualControlValue(!isQualControlValue)
                        }}
                    />
                </div>
            </div>

            {/* <div className={styles.field_container}>
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
            </div> */}
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