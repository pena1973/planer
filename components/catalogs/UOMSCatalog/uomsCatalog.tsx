
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


    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [uomsValue, setUomsValue] = useState([] as UOMItem[]);

    const downloadUoms = async () => {
        try {
            const res = await fetch(`api/uoms-api?userId=${1}&companyId=${1}`,
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
                    let uoms_ = receivedData.uoms as UOMItem[]
                    setUomsValue(uoms_);
                    dispatch(setUOMs(uoms_));
                }
                else setMessage(receivedData.error);
            }
        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
        }
    }

    useEffect(() => {
        downloadUoms();
    }, []);

    // колбеки кнопки
    const deleteUOMSHandler = (indexToRemove: number) => {
        let uomsValueUpdated = [...uomsValue]
        uomsValueUpdated.splice(indexToRemove, 1)
        setUomsValue(uomsValueUpdated)
        setModified(true);
    };

    const changeUOMSTitleHandler = (indexToChange: number, title: string) => {
        let uom = uomsValue[indexToChange];
        let updatedUOM = { ...uom, title: title }
        let uomsValueUpdated = [...uomsValue]
        uomsValueUpdated.splice(indexToChange, 1, updatedUOM)
        setUomsValue(uomsValueUpdated)
        setModified(true);
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
            const res = await fetch(`api/uoms-api?userId=${1}&companyId=${1}`,
                {
                    method: 'post',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
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
                console.log("receivedData", receivedData)

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
            // setMessage(t('service.noConnection') + e.message)            
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




    let uomsValueReactNodes = uomsValue.map((elem, index) => (
        (
            <tr key={index}>
                <td>
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteUOMSHandler(index)}
                    />
                </td>

                <td>
                    <input className={styles.uoms_title}
                        id={"title" + elem.title}
                        autoComplete="off"
                        value={elem.title} type="text"
                        onChange={e => {
                            setModified(true);
                            changeUOMSTitleHandler(index, e.target.value)
                        }} />

                </td>
            </tr>
        )
    ))
    return (
        <div className={styles.container_uoms}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelUOMtHandler() }}
            />
            <table >
                <thead>
                    <tr>
                        <th className={styles.icon_del_top}></th>
                        <th className={styles.uoms_title_top}>Название</th>
                    </tr>
                </thead>
                <tbody>
                    {uomsValueReactNodes}
                </tbody>
            </table>
            <div className={styles.container_buttons_row}>
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