
import styles from "./systemSettings.module.scss";

import { SettingsItem } from '@/types'
import Image from 'next/image';

import { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";


import { setSettings } from '@/store/slices'

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
    const [isQualControlValue, setIsQualControlValue] = useState(true);
    // const [showHolidayValue, setShowHolidayValue] = useState(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setIsQualControlValue(settings.isQualControl);
    }, []);

    // колбеки кнопки


    const saveSettingsHandler = async () => {
        setMessage("");
        const settings_ = { ...settings, isQualControl: isQualControlValue, }

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
                        settings: settings_,
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
                    //   Обновим настройки
                    dispatch(setSettings(receivedData.settings as SettingsItem));
                    setModified(false);
                    // setMessage("Обновлены настройки");
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

        setModified(false)
    };


    return (
        <div className={styles.container}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelScheduleHandler() }}
            />

            <div className={styles.field_container}>
                <div className={styles.title}>{t('settings.control')}</div>
                <div className={styles.input_container}>
                    <input

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