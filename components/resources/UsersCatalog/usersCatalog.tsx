
import styles from "./usersCatalog.module.scss";
import { saveUsersUnits } from '@/services/resources/saveUsersUnits';
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import DropdownSelectUnit from "./DropdownSelectUnit/dropdownSelectUnit";

import { TeamItem, UserUnitItem, UserItem, UnitBelongEnum } from '@/types/types'
import Image from 'next/image';

import { useEffect, useState  } from "react";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import { useTranslation } from 'react-i18next';

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";

export interface usersCatalogProps {
    user: UserItem, // my user
    team: TeamItem,
    setMessage: (message: string) => void,
    token: string
}

export default function UsersCatalog({
    user,
    team,
    setMessage,
    token
}: usersCatalogProps) {

    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();



    const [userUnitsValue, setUserUnitsValue] = useState([] as UserUnitItem[]);
    // const users_units_old = useRef(users_units); // для восстановления по cancel    

    const [modified, setModified] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [buttonLoader, setButtonLoader] = useState(false);

    const units = useAppSelector((state: RootState) => {
        return state.catalogSlice.units;
    })
    const userUnits = useAppSelector((state: RootState) => {
        return state.catalogSlice.userUnits;
    })
  
    const selectedUnits = userUnits
        .map((u) => u.unit)
        .filter((unit) => unit !== undefined && unit !== null);  // Фильтруем null и undefined
   

    useEffect(() => {
        setUserUnitsValue(userUnits);
    }, []);
  
    // На сервере
    const saveUsersUnitsHandler = async () => {
        setButtonLoader(true);
        await saveUsersUnits(userUnitsValue, user, team, token, t, i18n.language,
            setMessage, setUserUnitsValue, dispatch)
            .then(() => {
                setModified(false);
            });

        setButtonLoader(false);
    };
    // На клиенте
    const cancelHandler = () => {
        setUserUnitsValue(userUnits);
        setModified(false);
    };
    // На клиенте
    const changeRowHandler = (indexToChange: number, value: boolean | number | null, field: string) => {

        switch (field) {
            case "units":
                let unit = null;
                if (typeof value === 'number') {
                    unit = units.find(unit => unit.id === value);
                    if (!unit) return;
                }
                const user_unit = userUnitsValue[indexToChange];
                const updated_user_unit = { ...user_unit, unit: unit };
                const updated_users_units = [...userUnitsValue];
                updated_users_units.splice(indexToChange, 1, updated_user_unit);
                setUserUnitsValue(updated_users_units);
                break;

            case "active":
                if (typeof value === 'boolean') {
                    const user_unit = userUnitsValue[indexToChange];
                    const updated_user_unit = { ...user_unit, active: value };
                    const updated_users_units = [...userUnitsValue];
                    updated_users_units.splice(indexToChange, 1, updated_user_unit);
                    setUserUnitsValue(updated_users_units);
                }
                break;


            default:
                break;
        }

        setModified(true);

    };
    // На клиенте
    const deleteRowHandler = (indexToRemove: number) => {
        const users_unitsUpdated = [...userUnits]
        users_unitsUpdated.splice(indexToRemove, 1)
        setUserUnitsValue(users_unitsUpdated)
        setModified(true);
    };

    const users_unitsReactNodes = userUnitsValue.map((user, index) => {

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
                        units={units.filter(u => u.belong === UnitBelongEnum.inner)}
                        selectedUnits={selectedUnits}  // Передаем массив выбранных юнитов
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

            {/* {!showLoader && <div>  </div>} */}

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
                            <th>{t('users.title')}</th>
                            <th>{t('users.unit')}</th>
                            <th>{t('users.active')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users_unitsReactNodes}
                    </tbody>
                </table>

                <div className={styles.container_buttons_row}>

                    <div className={styles.container_icon_edit_save}>
                        {buttonLoader && <ButtonLoader />}
                        {!buttonLoader &&
                            <Image className={styles.icon_edit_save}
                                src={save}
                                alt="arrow" width={20} height={20}
                                onClick={() => {
                                    saveUsersUnitsHandler()
                                }}
                            />}
                        {modified && <div>*</div>}
                    </div>

                </div>

            </div >}
            {showLoader && <div>
                <pre />
                <ButtonLoader width={200} height={200} />
                <pre />
            </div>}
        </div>
    )
}