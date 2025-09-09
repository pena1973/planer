
import styles from "./settings.module.scss";
import { saveSettings } from '@/services/resources/saveSettings';

import Image from 'next/image';

import { useEffect, useState } from "react";


import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
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

    const settings = useAppSelector((state: RootState) => {
        return state.catalogSlice.settings;
    })

    const team = useAppSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useAppSelector((state: RootState) => {
        return state.authSlice.user;
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
    }, []);

    // На сервере
    const saveSettingsHandler = async () => {
        await saveSettings(timeStartWorkValue, timeFinishWorkValue, showWeekendValue, showHolidayValue,
            user, team, token, dispatch, t, setMessage, setModified,
            setTimeStartWorkValue, setTimeFinishWorkValue, setShowWeekendValue, setShowHolidayValue);
    };
    // На клиенте
    const cancelScheduleHandler = () => {
        setTimeStartWorkValue(settings.timeStartWork);
        setTimeFinishWorkValue(settings.timeFinishWork);
        setShowWeekendValue(settings.showWeekend);
        setShowHolidayValue(settings.showHoliday);
        setModified(false);
        setMessage("");
    };

    // На клиенте
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