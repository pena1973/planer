
import styles from "./settings.module.scss";

import { SettingsItem } from '@/types'
import Image from 'next/image';

import { useEffect, useState } from "react";

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";


import { useTranslation } from 'react-i18next';

import { setSettings } from '@/store/slices'

import cancel from "@/public/cancel.png";
import save from "@/public/save-rem.png";


export interface SettingsProps {
    setMessage: (message: string) => void,
    token: string
}

export default function Settings({
    setMessage,
    token
}: SettingsProps) {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();

    const settings = useSelector((state: RootState) => {
        return state.catalogSlice.settings;
    })

    const team = useSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useSelector((state: RootState) => {
        return state.authSlice.user;
    })

    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [timeStartWorkValue, setTimeStartWorkValue] = useState(0);
    const [timeFinishWorkValue, setTimeFinishWorkValue] = useState(0);
    const [showWeekendValue, setShowWeekendValue] = useState(true);
    const [showHolidayValue, setShowHolidayValue] = useState(true);

   // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setTimeStartWorkValue(settings.timeStartWork);
        setTimeFinishWorkValue(settings.timeFinishWork);
        setShowWeekendValue(settings.showWeekend);
        setShowHolidayValue(settings.showHoliday);
        setModified(false);
    }, []);

    // колбеки кнопки


    const saveSettingsHandler = async () => {
        setMessage("");
        const settings = {
            timeStartWork: timeStartWorkValue,
            timeFinishWork: timeFinishWorkValue,
            showWeekend: showWeekendValue,
            showHoliday: showHolidayValue,
        }

        // запрос на сохранение
        try {
            // запрос получение текста из БД вместе со словами     textId: number, userId:number
            const res = await fetch(`api/settings-api`,
                {
                    method: 'post',
                    headers: new Headers({
                        'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        userId: user.id,
                        teamId: team.id,
                        settings: settings,
                    }),
                }
            );
            if (res.status !== 200) {
                const receivedData = await res.json();
                const error = receivedData.error;
                // setMessage(error);
                //  console.log(t('service.serverUnavailable') + res.status);
                setMessage(t('service.serverUnavailable') + error);
            } else {
                const receivedData = await res.json();
                // console.log("receivedData", receivedData)

                if (receivedData.success) {
                    //   Обновим текущую карту
                    const settings = receivedData.settings as SettingsItem
                    dispatch(setSettings(settings));
                    setTimeStartWorkValue(settings.timeStartWork);
                    setTimeFinishWorkValue(settings.timeFinishWork);
                    setShowWeekendValue(settings.showWeekend);
                    setShowHolidayValue(settings.showHoliday);
                    setModified(false);
                    setMessage(t('settings.settingUpdated'));
                } else setMessage(receivedData.error);
            }

            // } catch (e: any) {
            //     setMessage(t('service.serverUnavailable') + e.message)
            // }
        } catch (e: unknown) {
            let message = t('service.serverUnavailable');
            if (e instanceof Error) {
                message += e.message;
            }
            setMessage(message);
        }


        setModified(false);
    };

    const cancelScheduleHandler = () => {
        setTimeStartWorkValue(settings.timeStartWork);
        setTimeFinishWorkValue(settings.timeFinishWork);
        setShowWeekendValue(settings.showWeekend);
        setShowHolidayValue(settings.showHoliday);
        setModified(false);
        setMessage("");
    };


    const changeHandler = (value: string | number, field: string) => {

        switch (field) {

            case "timeStart":
                setTimeStartWorkValue((!value) ? 0 : value as number);
                break;
            case "timeFinish":
                setTimeFinishWorkValue((!value) ? 0 : value as number);
                break;
            default:
                break;
        }

        setModified(true);
        setMessage("");
    };



    return (
        <div className={styles.container}>
            <Image
                className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelScheduleHandler() }}
            />

            <div className={styles.field_container}>
                <div className={styles.title}>{t('settings.showTime')}</div>
                &nbsp;
                <div className={styles.time_container} >
                    <div className={styles.input_container}>
                        <div className={styles.title}>{t('settings.start')}</div>
                        <input
                            className={styles.time_input}
                            id="timeStart"
                            autoComplete="off"
                            value={timeStartWorkValue !== undefined
                                ? `${String(Math.floor(timeStartWorkValue / 60)).padStart(2, '0')}:${String(timeStartWorkValue % 60).padStart(2, '0')}`
                                : "00:00"}
                            type="time"
                            onChange={e => {
                                setMessage("");
                                setModified(true);
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                                changeHandler(totalMinutes, "timeStart");
                            }}
                        />
                    </div>
                    <div className={styles.input_container}>
                        <div className={styles.title}>{t('settings.end')}</div>
                        <input
                            className={styles.time_input}
                            id="timeFinish"
                            autoComplete="off"
                            value={timeFinishWorkValue !== undefined
                                ? `${String(Math.floor(timeFinishWorkValue / 60)).padStart(2, '0')}:${String(timeFinishWorkValue % 60).padStart(2, '0')}`
                                : "00:00"}
                            type="time"
                            onChange={e => {
                                setMessage("");
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
                <div className={styles.title}>{t('settings.showWeekends')}</div>
                <div className={styles.input_container}>
                    <input

                        id="showWeekend"
                        autoComplete="off"
                        checked={showWeekendValue}
                        type="checkbox"
                        onChange={e => {
                            setMessage("");
                            setModified(true);
                            setShowWeekendValue(!showWeekendValue)
                        }}
                    />
                </div>
            </div>

            <div className={styles.field_container}>
                <div className={styles.title}>{t('settings.showHolidays')}</div>
                <div className={styles.input_container}>
                    <input

                        id="showWeekend"
                        autoComplete="off"
                        checked={showHolidayValue}
                        type="checkbox"
                        onChange={e => {
                            setMessage("");
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