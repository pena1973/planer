
import styles from "./usersCatalog.module.scss";

import DropdownSelectWeekDay from "./DropdownSelectWeekDay/dropdownSelectWeekDay";

import { DaysOfWeek, TeamItem, ScheduleItem, TimeZoneEnum, UserItem } from '@/types'
import Image from 'next/image';

import { useEffect, useState, useRef } from "react";

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setSchedule, } from '@/store/slices'

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface usersCatalogProps {
    users: UserItem[],
    setMessage: (message: string) => void
}

export default function UsersCatalog({
    users,
    setMessage
}: usersCatalogProps) {

    const dispatch = useAppDispatch();

    const schedule = useSelector((state: RootState) => {
        return state.catalogSlice.schedule;
    })

    //!!!!  Загрузить всех юзеров в таблицу

    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы

    const [teamValue, setTeamValue] = useState("");
    const teamNumberValue = "LU000001";

    const [comentValue, setComentValue] = useState("");

    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        //    если есть расписание 
        if (schedule.team) {
            setTeamValue(schedule.team.title);
            setComentValue(schedule.team.prefix)

        }
    }, []);

    // колбеки кнопки


    const cancelScheduleHandler = () => {
        setTeamValue(schedule.team.title);
        setComentValue(schedule.team.prefix)
        setModified(false);
    };


    const changeHandler = (value: string | number | TimeZoneEnum | null, field: string) => {

        switch (field) {
            case "team":
                setTeamValue(value as string);
            case "coment":
                setComentValue(value as string);
                break;
        }

        setModified(true);
    };

    // дерево отчета
    let unitsReactNodes = users.map((user, index) => {

        return (
            <tr key={index}>
                <td> {user.name}</td>
                <td> </td>
                <td> </td>
                <td> </td>
                <td> </td>
                <td> </td>
            </tr >


        )
    })


    return (
        <div className={styles.container}>
            {!showLoader && <div>  фильтр заглушка</div>}
            {!showLoader && <div className={styles.table_container}>
                {/* Шапка таблицы */}
                <table className={styles._table}>
                    <thead>
                        <tr>
                            <th className={styles.unit_top} >User</th>
                            <th className={styles.unit_top}> Unit </th>
                            <th>Date start</th>
                            <th>Date finish</th>
                            <th>Eraz</th>
                            <th>Arhiv</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unitsReactNodes}
                    </tbody>
                </table>
            </div >}
        </div>
    )
}