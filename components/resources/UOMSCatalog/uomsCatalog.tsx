
import styles from "./uomsCatalog.module.scss";

import { UOMItem } from '@/types'
import Image from 'next/image';

import { useEffect, useState, useRef } from "react";

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setUOMs, } from '@/store/slices'

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

export default function UOMSCatalog({ setMessage }: UOMSCatalogProps) {
    const dispatch = useAppDispatch();

    const uoms = useSelector((state: RootState) => {
        return state.catalogSlice.uoms;
    })

    const team = useSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useSelector((state: RootState) => {
        return state.authSlice.user;
    })


    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [uomsValue, setUomsValue] = useState([] as UOMItem[]);

   

    useEffect(() => {
        setUomsValue(uoms);
        // downloadUoms();
    }, []);

    // колбеки кнопки
    const deleteUOMSHandler = (indexToRemove: number) => {
        let uomsValueUpdated = [...uomsValue]
        uomsValueUpdated.splice(indexToRemove, 1)
        setUomsValue(uomsValueUpdated)
        setModified(true);
    };

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
        let uomsValueUpdated = [...uomsValue]
        uomsValueUpdated.splice(indexToChange, 1, updatedUOM)
        setUomsValue(uomsValueUpdated)

    };

    const saveUOMSHandler = async () => {
        setMessage("");
        uomsValue.forEach((elem, index) => {
            if (!elem.title) {
                setMessage(`Заполните название единицы измерения строка ${index}!`);
                return;
            }
        })
        // запрос на сохранение
        try {
            // запрос получение текста из БД вместе со словами     textId: number, userId:number
            const res = await fetch(`api/uoms-api`,
                {
                    method: 'post',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        userId: user.id,
                        teamId: team.id,
                        uoms: uomsValue
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
                    let uoms_ = receivedData.uoms as UOMItem[]
                    dispatch(setUOMs(uoms_));
                    setUomsValue(uoms_);
                    setModified(false);
                    setMessage("Обновлен список единиц измерения");
                } else setMessage(receivedData.error);
            }

        } catch (e: any) {
            // setMessage(t('service.serverUnavailable') + e.message)            
        }

        setModified(false);
    };

    const addUOMtHandler = () => {

        let newUOM = {} as UOMItem;
        setUomsValue([...uomsValue, newUOM])
        setModified(true);
    };
    const cancelUOMtHandler = () => {
        setUomsValue([...uoms]);
        setModified(false)
    };




    let uomsValueReactNodes = uomsValue.map((uom, index) => (
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