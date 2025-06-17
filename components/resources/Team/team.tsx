
import styles from "./team.module.scss";

import { TeamItem, UserItem } from '@/types/types'
import { generateTeamNumber } from '@/utils'

import Image from 'next/image';
import { useEffect, useState } from "react";

import { useAppDispatch } from "@/pages/_app";
import { setTeam, } from '@/store/slices'

import { useTranslation } from 'react-i18next';

import cancel from "@/public/cancel.png";
import save from "@/public/save-rem.png";

export interface TeamProps {
    user: UserItem,
    team: TeamItem,
    setMessage: (message: string) => void,
    token: string
}

export default function Team({
    user,
    team,
    setMessage,
    token

}: TeamProps) {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();

    const [modified, setModified] = useState(false);
    const [titleValue, setTitleValue] = useState("");
    const [comentValue, setComentValue] = useState("");

    const teamNumberValue = generateTeamNumber(team.prefix, team.id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (team) {
            setTitleValue(team.title);
            setComentValue(team.coment)
        }
    }, []);


    const cancelHandler = () => {
        setTitleValue(team.title);
        setComentValue(team.coment)
        setModified(false);
    };


    const changeHandler = (value: string, field: string) => {

        switch (field) {
            case "team":
                setTitleValue(value as string);
                break;
            case "coment":
                setComentValue(value as string);
                break;
        }

        setModified(true);
    };

    const saveTeamHandler = async () => {
        setMessage("");

        // запрос на сохранение
        try {
            const res = await fetch(`api/team-api?userId=${user.id}&teamId=${team.id}`,
                {
                    method: 'post',
                    headers: new Headers({
                        'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        title: titleValue,
                        coment: comentValue,
                        teamId: team.id
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
                    const team_ = receivedData.team as TeamItem
                    dispatch(setTeam(team_));
                    setModified(false);
                    // setMessage("Обновлены настройки");
                    setMessage(t('team.settingUpdated'));

                } else setMessage(receivedData.error);
            }

            // } catch (e: any) {
            //     // setMessage(t('service.serverUnavailable') + e.message)            
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


    return (
        <div className={styles.container}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow"
                width={24} height={24}
                onClick={() => { cancelHandler() }}
            />

            <div className={styles.field_container}>

                <div className={styles.label_container}>
                    <div className={styles.label}>{t('team.teamTitle')}</div>
                    <input className={styles.team_input}
                        id={"team"}
                        autoComplete="off"
                        value={titleValue}
                        type="text"
                        onChange={e => {
                            setModified(true);
                            changeHandler(e.target.value, "team")
                        }} />
                </div>

                <div className={styles.label_container}>
                    <div className={styles.label}>{t('team.teamNumber')}</div>
                    <input className={styles.team_number_input}
                        id={"teamNumber"}
                        autoComplete="off"
                        value={teamNumberValue}
                        type="text"
                        readOnly
                    />
                </div>
                <div className={styles.coment_container}>
                    <div className={styles.coment_label}>{t('team.teamComent')}</div>
                    <textarea className={styles.coment_input}
                        id={"teamNumber"}
                        autoComplete="off"
                        value={comentValue}
                        onChange={e => {
                            setModified(true);
                            changeHandler(e.target.value, "coment")
                        }} />
                </div>

            </div>

            <div className={styles.container_buttons_row}>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => { saveTeamHandler() }}
                    />
                    {modified && <div>*</div>}
                </div>

            </div>


        </div>


    )
}