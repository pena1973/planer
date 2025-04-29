
import styles from "./usersCatalog.module.scss";

import DropdownSelectUnit from "./DropdownSelectUnit/dropdownSelectUnit";

import { DaysOfWeek, TeamItem, UserUnitItem, TimeZoneEnum, UserItem, UnitItem } from '@/types'
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
    user: UserItem, // my user
    team: TeamItem,
    setMessage: (message: string) => void
}

export default function UsersCatalog({

    user,
    team,
    setMessage
}: usersCatalogProps) {

    const dispatch = useAppDispatch();
    const [users_units, setUsersUnits] = useState([] as UserUnitItem[]);
    const users_units_old = useRef(users_units); // для восстановления по cancel


    const units = useSelector((state: RootState) => {
        return state.catalogSlice.units;
    })

    const getUsersUnits = async () => {
        setShowLoader(true);
        try {
            const res = await fetch(`api/users-units-api?userId=${user.id}&teamId=${team.id}`,
                {
                    method: 'get',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                }
            );
            if (res.status !== 200) {
                const receivedData = await res.json();
                setMessage(receivedData.message);

                //  console.log(t('service.serverUnavailable') + res.status);
                // setMessage(t('service.serverUnavailable') + res.status);
            } else {
                const receivedData = await res.json();
                // console.log("receivedData", receivedData)

                if (receivedData.success) {
                    let users_units_ = receivedData.users_units as UserUnitItem[];
                    setUsersUnits(users_units_);
                    users_units_old.current = users_units_;
                    // setMessage(receivedData.message);
                }
            }

        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
        }
        setShowLoader(false);
    }

    useEffect(() => {
        getUsersUnits();
    }, []);



    //!!!!  Загрузить всех юзеров в таблицу

    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы

    const [showLoader, setShowLoader] = useState(false);

    const saveUsersUnitsHandler = () => {
        // setShowLoader(true);
        // fetch(`api/users-units-api`, {
        //     method: 'post',
        //     headers: new Headers({
        //         'Content-Type': 'application/json'
        //     }),
        //     body: JSON.stringify(users_units)
        // })
        //     .then((res) => {
        //         if (res.status !== 200) {
        //             const receivedData = res.json();
        //             setMessage(receivedData.message);
        //         } else {
        //             const receivedData = res.json();
        //             if (receivedData.success) {
        //                 setMessage(receivedData.message);
        //                 users_units_old.current = users_units;
        //                 setModified(false);
        //             }
        //         }
        //     })
        //     .catch((e) => {
        //         // setMessage(t('service.noConnection') + e.message)
        //     })
        //     .finally(() => {
        //         setShowLoader(false);
        //     });
    };
    const cancelHandler = () => {
        setUsersUnits(users_units_old.current);
        setModified(false);
    };

    const changeRowHandler = (indexToChange: number, value: boolean | number | null, field: string) => {

        switch (field) {
            case "units":
                if (typeof value === 'number') {
                    let unit = units.find(unit => unit.id === value);
                    if (!unit) return;

                    let user_unit = users_units[indexToChange];
                    let updated_user_unit = { ...user_unit, unit: unit as UnitItem };
                    let updated_users_units = [...users_units];
                    updated_users_units.splice(indexToChange, 1, updated_user_unit);
                    setUsersUnits(updated_users_units);
                }
                break;



            case "active":
                if (typeof value === 'boolean') {
                    let user_unit = users_units[indexToChange];
                    let updated_user_unit = { ...user_unit, active: value };
                    let updated_users_units = [...users_units];
                    updated_users_units.splice(indexToChange, 1, updated_user_unit);
                    setUsersUnits(updated_users_units);
                }
                break;


            default:
                break;
        }

        setModified(true);

    };
    const deleteRowHandler = (indexToRemove: number) => {
        let users_unitsUpdated = [...users_units]
        users_unitsUpdated.splice(indexToRemove, 1)
        setUsersUnits(users_unitsUpdated)
        setModified(true);
    };

    let users_unitsReactNodes = users_units.map((user, index) => {

        return (
            <tr key={index}>
                <td>
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteRowHandler(index)}
                    />
                </td>
                <td> {user.name}</td>
                <td>
                    <DropdownSelectUnit
                        onSelect={(value) => {
                            changeRowHandler(index, value, "units");
                        }}
                        selectedValue={user.unit?.id || null}
                        units={units}
                    />
                </td>
                <td>
                    <input
                        className={styles.date}
                        id={`date-${index}`}
                        autoComplete="off"
                        checked={user.active}  // Используем checked для checkbox
                        type="checkbox"
                        onChange={e => {
                            changeRowHandler(index, e.target.checked, "active"); // Передаем checked (boolean)
                        }}
                    />
                </td>

            </tr >

        )
    })


    return (
        <div className={styles.container}>

            {!showLoader && <div>  фильтр заглушка</div>}
            {!showLoader && <div className={styles.table_container}>
                <Image className={styles.icon_cancel}
                    src={cancel}
                    alt="arrow"
                    width={24} height={24}
                    onClick={() => {
                        cancelHandler()
                    }}
                />
                {/* Шапка таблицы */}
                <table className={styles._table}>
                    <thead>
                        <tr>
                            <th> </th>
                            <th>User</th>
                            <th>Unit </th>
                            <th>Activ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users_unitsReactNodes}
                    </tbody>
                </table>

                <div className={styles.container_buttons_row}>

                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={save}
                            alt="arrow" width={20} height={20}
                            onClick={() => {
                                saveUsersUnitsHandler()
                            }}
                        />
                        {modified && <div>*</div>}
                    </div>

                </div>

            </div >}
        </div>
    )
}