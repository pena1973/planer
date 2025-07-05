
import styles from "./systemSettings.module.scss";
import { saveSystemSettings } from '@/services/resources/saveSystemSettings';

import Image from 'next/image';

import { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

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


    useEffect(() => {
        setIsQualControlValue(settings.isQualControl);
    }, []);

    

    // На сервере
    const saveSettingsHandler = async () => {
        await saveSystemSettings(settings, isQualControlValue, user, team, token, dispatch, t, setMessage, setModified);
       
    };

    // На клиенте
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