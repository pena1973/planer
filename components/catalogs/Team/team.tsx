
import styles from "./team.module.scss";

import { TeamItem, UserItem } from '@/types'
import { generateTeamNumber } from '@/utils'

import Image from 'next/image';

import { useEffect, useState, useRef } from "react";

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setTeam,  } from '@/store/slices'

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import cancel from "@/public/cancel.png";
import save from "@/public/save-rem.png";


export interface TeamScheduleProps {
    user:UserItem,
    team: TeamItem,
    setMessage: (message: string) => void,
    // saveTeamHandler: (title: string,coment:string) => void
}

export default function TeamSchedule({
    user,
    team,
    setMessage,
    // saveTeamHandler
}: TeamScheduleProps) {
    
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

    // колбеки кнопки


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
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        title: titleValue,
                        coment:comentValue,
                        teamId:team.id
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
                    //   Обновим текущую карту
                    let team_ = receivedData.team as TeamItem
                    dispatch(setTeam(team_));                    
                    setModified(false);
                    setMessage("Обновлены настройки");
                } else setMessage(receivedData.error);
            }

        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
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
                    <div className={styles.label}>Команда</div>
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
                    <div className={styles.label}>Номер команды</div>
                    <input className={styles.team_number_input}
                        id={"teamNumber"}
                        autoComplete="off"
                        value={teamNumberValue}
                        type="text"
                        readOnly
                    />
                </div>
                <div className={styles.coment_container}>

                    <div className={styles.coment_label}>Коментарий</div>

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
                        onClick={() => {saveTeamHandler()}}
                    />
                    {modified && <div>*</div>}
                </div>

            </div>


        </div>


    )
}