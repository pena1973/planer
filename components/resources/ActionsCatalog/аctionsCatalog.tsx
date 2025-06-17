
import styles from "./аctionsCatalog.module.scss";
import { ActionItem } from '@/types/types'
import Image from 'next/image';
import { useEffect, useState } from "react";

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { setActions, } from '@/store/slices'

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
    const actions = useSelector((state: RootState) => {
        return state.catalogSlice.actions;
    })


    const team = useSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useSelector((state: RootState) => {
        return state.authSlice.user;
    })

    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [actionsValue, setActionsValue] = useState([] as ActionItem[]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setActionsValue(actions);
    },[]);

    // колбеки кнопки
    const deleteActionHandler = (indexToRemove: number) => {
        const actionsValueUpdated = [...actionsValue]
        actionsValueUpdated.splice(indexToRemove, 1)
        setActionsValue(actionsValueUpdated)
        setModified(true);
    };

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

    const saveActionHandler = async () => {
        setMessage("");
        actionsValue.forEach((elem) => {
            if (!elem.title) {
                // "Заполните название действия!"
                setMessage(t('actionsCatalog.filltitle'));
                return;
            }
        })

        // запрос на сохранение
        try {
            // запрос получение текста из БД вместе со словами     textId: number, userId:number
            const res = await fetch(`api/actions-api`,
                {
                    method: 'post',
                    headers: new Headers({
                        'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        userId: user.id,
                        teamId: team.id,
                        actions: actionsValue
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
                    const actions_ = receivedData.actions as ActionItem[]
                    dispatch(setActions(actions_));
                    setActionsValue(actions_)
                    setModified(false);
                    // setMessage("Обновлен список Действий");
                    setMessage(t('actionsCatalog.listUpdated'));

                } else setMessage(receivedData.error);
            }

            // } catch (e: any) {
            //      setMessage(t('service.serverUnavailable') + e.message)            
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

    const addActionHandler = () => {

        const newAction = {} as ActionItem;
        setActionsValue([...actionsValue, newAction])
        setModified(true);
    };
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