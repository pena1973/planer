
import styles from "./team.module.scss";
import { saveTeam } from '@/services/resources/saveTeam';
import { TeamItem, UserItem } from '@/types/types'
import { generateTeamNumber } from '@/lib/utils'

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

    useEffect(() => {
        if (team) {
            setTitleValue(team.title);
            setComentValue(team.coment)
        }
    }, []);

    // На клиенте
    const cancelHandler = () => {
        setTitleValue(team.title);
        setComentValue(team.coment)
        setModified(false);
    };

    // На клиенте
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

    // На сервере
    const saveTeamHandler = async () => {
        setMessage("");
        await saveTeam(titleValue, comentValue, user, team, token, dispatch, t, setMessage, setModified);
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