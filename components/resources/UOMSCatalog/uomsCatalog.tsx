
import styles from "./uomsCatalog.module.scss";
import { saveUOMs } from '@/services/resources/saveUOMs';
import { UOMItem } from '@/types/types'
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { useEffect, useState } from "react";


import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface UOMSCatalogProps {
    setMessage: (message: string) => void,
}

export default function UOMSCatalog({ setMessage }: UOMSCatalogProps) {

    const { t, i18n } = useTranslation();

    const dispatch = useAppDispatch();

    const token = useAppSelector((state: RootState) => {
        return state.authSlice.token;
    })
    const uoms = useAppSelector((state: RootState) => {
        return state.catalogSlice.uoms;
    })

    const team = useAppSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useAppSelector((state: RootState) => {
        return state.authSlice.user;
    })

    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [uomsValue, setUomsValue] = useState([] as UOMItem[]);

    useEffect(() => {
        setUomsValue(uoms);
    }, []);


    // На клиенте
    const deleteUOMSHandler = (indexToRemove: number) => {
        const uomsValueUpdated = [...uomsValue]
        uomsValueUpdated.splice(indexToRemove, 1)
        setUomsValue(uomsValueUpdated)
        setModified(true);
    };
    // На клиенте
    const changeUOMHandler = (indexToChange: number, value: string, field: string) => {
        setModified(true);
        let updatedUOM = uomsValue[indexToChange];

        switch (field) {
            case "title":

                updatedUOM = { ...updatedUOM, title: value }
                break;
            case "code":
                updatedUOM = { ...updatedUOM, code: value }
                break;
            default:
                break;
        }
        const uomsValueUpdated = [...uomsValue]
        uomsValueUpdated.splice(indexToChange, 1, updatedUOM)
        setUomsValue(uomsValueUpdated)

    };

    // На сервере  // На клиенте
    const saveUOMSHandler = async () => {
        setMessage("");
        uomsValue.forEach((elem, index) => {
            if (!elem.title) {
                setMessage(`Заполните название единицы измерения строка ${index}!`);
                return;
            }
        })
        await saveUOMs(uomsValue, user, team, token, dispatch, t, setMessage, setUomsValue, setModified);
        
    };
    // На клиенте
    const addUOMtHandler = () => {

        const newUOM = {} as UOMItem;
        setUomsValue([...uomsValue, newUOM])
        setModified(true);
    };
    // На клиенте
    const cancelUOMtHandler = () => {
        setUomsValue([...uoms]);
        setModified(false)
    };

    const uomsValueReactNodes = uomsValue.map((uom, index) => (
        (
            <tr key={index}>
                <td>
                    <Image

                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteUOMSHandler(index)}
                    />
                </td>
                <td>
                    <input
                        className={styles.uoms_input}
                        id={"code" + uom.title}
                        autoComplete="off"
                        value={uom.code} type="text"
                        maxLength={6}
                        onChange={e => {
                            setModified(true);
                            changeUOMHandler(index, e.target.value, "code")
                        }} />
                </td>
                <td>
                    <input
                        className={styles.uoms_input}
                        id={"title" + uom.title}
                        autoComplete="off"
                        value={uom.title} type="text"
                        onChange={e => {
                            setModified(true);
                            changeUOMHandler(index, e.target.value, "title")
                        }} />

                </td>
            </tr>
        )
    ))

    return (
        <div className={styles.container}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelUOMtHandler() }}
            />
            <table className={styles._table}>
                <thead>
                    <tr>
                        <th></th>
                        <th>Code</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {uomsValueReactNodes}
                </tbody>
            </table>
            <div className={styles.container_buttons_row_table}>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={add}
                        alt="arrow" width={20} height={20}
                        onClick={() => { addUOMtHandler() }}
                    />
                </div>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => { saveUOMSHandler() }}
                    />
                    {modified && <div>*</div>}
                </div>

            </div>
        </div>


    )
}