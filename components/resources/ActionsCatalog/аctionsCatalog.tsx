
import styles from "./аctionsCatalog.module.scss";
import { saveActions } from '@/services/resources/saveActions';
import { ActionItem } from '@/types/types'
import Image from 'next/image';
import { useEffect, useState } from "react";


import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import { useTranslation } from 'react-i18next';

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface ActionsCatalogProps {
    setMessage: (message: string) => void,
    token: string
}

export default function ActionsCatalog({
    setMessage,
    token
}: ActionsCatalogProps) {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();

    const actions = useAppSelector((state: RootState) => {
        return state.catalogSlice.actions;
    })

    const team = useAppSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useAppSelector((state: RootState) => {
        return state.authSlice.user;
    })

    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [actionsValue, setActionsValue] = useState([] as ActionItem[]);

    useEffect(() => {
        setActionsValue(actions);
    }, []);

    // На клиенте
    const deleteActionHandler = (indexToRemove: number) => {
        const actionsValueUpdated = [...actionsValue]
        actionsValueUpdated.splice(indexToRemove, 1)
        setActionsValue(actionsValueUpdated)
        setModified(true);
    };

    // На клиенте
    const changeActionHandler = (indexToChange: number, value: string | boolean, field: string) => {
        const action = actionsValue[indexToChange];
        let updatedAction = action;
        switch (field) {
            case "code":
                updatedAction = { ...action, code: value as string }
                break;
            case "interruptible":
                updatedAction = { ...action, interruptible: value as boolean }
                break;
            case "title":
                updatedAction = { ...action, title: value as string }
                break;
            default:
                break;
        }
        const actionsValueUpdated = [...actionsValue]
        actionsValueUpdated.splice(indexToChange, 1, updatedAction)
        setActionsValue(actionsValueUpdated)
        setModified(true);
    };

    // На сервере  // На клиенте
    const saveActionHandler = async () => {
        setMessage("");
        actionsValue.forEach((elem) => {
            if (!elem.title) {
                // "Заполните название действия!"
                setMessage(t('actionsCatalog.filltitle'));
                return;
            }
        })
        saveActions(actionsValue, user, team, token, dispatch, t, setMessage, setActionsValue, setModified);
      
    };

    // На клиенте
    const addActionHandler = () => {

        const newAction = {} as ActionItem;
        setActionsValue([...actionsValue, newAction])
        setModified(true);
    };
    // На клиенте
    const cancelActionsHandler = () => {
        setActionsValue([...actions]);
        setModified(false)
    };

    const unitFocusActionValueReactNodes = actionsValue.map((action, index) => (
        (
            <tr key={index}>
                <td>
                    <Image
                        //  className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteActionHandler(index)}
                    />
                </td>
                <td>
                    <input
                        className={styles.actions_input}
                        id={"code" + action.title}
                        autoComplete="off"
                        value={action.code} type="text"
                        maxLength={6}
                        onChange={e => {
                            setModified(true);
                            changeActionHandler(index, e.target.value, "code")
                        }} />
                </td>
                <td>
                    <input
                        className={styles.actions_input}
                        // className={styles.actions_title}
                        id={"title" + action.id}
                        autoComplete="off"
                        value={action.title} type="text"
                        onChange={e => {
                            setModified(true);
                            changeActionHandler(index, e.target.value, "title")
                        }} />

                </td>
                <td className={styles.actions_td}>
                    <input
                        // className={styles.actions_interruptible}
                        id={"interruptible" + action.id}
                        autoComplete="off"
                        checked={action.interruptible}
                        type="checkbox"
                        onChange={e => {
                            setModified(true);
                            changeActionHandler(index, e.target.checked, "interruptible")
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
                onClick={() => { cancelActionsHandler() }}
            />
            <table className={styles._table}>
                <thead>
                    <tr>
                        <th ></th>
                        <th>{t('actionsCatalog.code')}</th>
                        <th>{t('actionsCatalog.name')}</th>
                        <th>{t('actionsCatalog.interaptible')}</th>
                    </tr>
                </thead>
                <tbody>
                    {unitFocusActionValueReactNodes}
                </tbody>
            </table>
            <div className={styles.container_buttons_row_table}>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={add}
                        alt="arrow" width={20} height={20}
                        onClick={() => { addActionHandler() }}
                    />
                </div>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => { saveActionHandler() }}
                    />
                    {modified && <div>*</div>}
                </div>

            </div>
        </div>
    )
}