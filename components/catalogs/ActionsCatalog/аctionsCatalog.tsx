
import styles from "./аctionsCatalog.module.scss";
import { ActionItem } from '@/types'
import Image from 'next/image';
import { useEffect, useState } from "react";

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { setActions, } from '@/store/slices'

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface UOMSCatalogProps {
    setMessage: (message: string) => void
}

export default function UOMSCatalog({
    setMessage
}: UOMSCatalogProps) {
    const dispatch = useAppDispatch();

    const actions = useSelector((state: RootState) => {
        return state.catalogSlice.actions;
    })


    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [actionsValue, setActionsValue] = useState([] as ActionItem[]);
  
    const downloadActions = async () => {
        // Загружаем классификатор действий
        try {
          const res = await fetch(`api/actions-api?userId=${1}&companyId=${1}`,
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
            let error = receivedData.error;
            setMessage(error);
            //  console.log(t('service.serverUnavailable') + res.status);
            // setMessage(t('service.serverUnavailable') + res.status);
    
          } else {
            const receivedData = await res.json();
            if (receivedData.success) {
              let actions_ = receivedData.actions as ActionItem[]             
              setActionsValue(actions_); 
              dispatch(setActions(actions_));
            }
            else setMessage(receivedData.error);
          }
        } catch (e: any) {
          // setMessage(t('service.noConnection') + e.message)            
        }
    
      }
    useEffect(() => {
        downloadActions()        
    }, []);

    // колбеки кнопки
    const deleteActionHandler = (indexToRemove: number) => {
        let actionsValueUpdated = [...actionsValue]
        actionsValueUpdated.splice(indexToRemove, 1)
        setActionsValue(actionsValueUpdated)
        setModified(true);
    };

    const changeActionHandler = (indexToChange: number, value: string | boolean, field: string) => {
        let action = actionsValue[indexToChange];
        let updatedAction = action;
        switch (field) {
            case "interruptible":
                updatedAction = { ...action, interruptible: value as boolean }
                break;
            case "title":
                updatedAction = { ...action, title: value as string }
                break;
            default:
                break;
        }
        let actionsValueUpdated = [...actionsValue]
        actionsValueUpdated.splice(indexToChange, 1, updatedAction)
        setActionsValue(actionsValueUpdated)
        setModified(true);
    };

    const saveActionHandler = async () => {
        setMessage("");
        actionsValue.forEach((elem) => {
            if (!elem.title) {
                setMessage("Заполните название действия!");
                return;
            }
        })

        // запрос на сохранение
        try {
            // запрос получение текста из БД вместе со словами     textId: number, userId:number
            const res = await fetch(`api/actions-api?userId=${1}&companyId=${1}`,
                {
                    method: 'post',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        actions: actionsValue
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
                    let actions_ = receivedData.actions as ActionItem[]
                    dispatch(setActions(actions_));
                    setActionsValue(actions_)
                    setModified(false);
                    setMessage("Обновлен список Действий");
                } else setMessage(receivedData.error);
            }

        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
        }

        setModified(false);
    };

    const addActionHandler = () => {

        let newAction = {} as ActionItem;
        setActionsValue([...actionsValue, newAction])
        setModified(true);
    };
    const cancelActionsHandler = () => {
        setActionsValue([...actions]);
        setModified(false)
    };

    let unitFocusActionValueReactNodes = actionsValue.map((elem, index) => (
        (
            <tr key={index}>
                <td>
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteActionHandler(index)}
                    />
                </td>

                <td>
                    <input className={styles.actions_title}
                        id={"title" + elem.id}
                        autoComplete="off"
                        value={elem.title} type="text"
                        onChange={e => {
                            setModified(true);
                            changeActionHandler(index, e.target.value,"title")
                        }} />

                </td>
                <td className={styles.actions_td}>
                    <input className={styles.actions_interruptible}
                        id={"interruptible" + elem.id}
                        autoComplete="off"
                        checked={elem.interruptible}
                        type="checkbox"
                        onChange={e => {
                            setModified(true);
                            changeActionHandler(index, e.target.checked,"interruptible")
                        }} />

                </td>
            </tr>
        )
    ))

    return (
        <div className={styles.container_actions}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelActionsHandler() }}
            />
            <table >
                <thead>
                    <tr>
                        <th className={styles.icon_del_top}></th>
                        <th className={styles.actions_title_top}>Название</th>
                        <th className={styles.actions_interruptible_top}>Можно прервать</th>
                    </tr>
                </thead>
                <tbody>
                    {unitFocusActionValueReactNodes}
                </tbody>
            </table>
            <div className={styles.container_buttons_row}>
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