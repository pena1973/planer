import { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import styles from "./tCardProductNew.module.scss";
import { UOMItem } from '@/types'
import DropdownSelectUOM from '@/components/DropdownSelectUOM/dropdownSelectUOM';

import Image from 'next/image';

import del from "@/public/del2.png";
import save from "@/public/save-rem.png";

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

export interface TCardProductProps {
    id: number,
    title: string,
    qtu: number,
    uom: UOMItem | null,
    deleteProductHandler: (id: number) => void,
    saveProductHandler: (id: number, code: string, qtu: number, uom: UOMItem) => void
}

export default function TCardProduct({
    id,
    title,
    qtu,
    uom,
    deleteProductHandler,
    saveProductHandler
}: TCardProductProps) {

    // const [editMode, setEditMode] = useState(false);
    const [edited, setEdited] = useState(false);

    const [titleValue, setTitleValue] = useState("");
    const [qtuValue, setQtuValue] = useState(0);
    const [uomValue, setUomValue] = useState<UOMItem | null>(null);
    
    const [message, setMessage] = useState("");

    useEffect(() => {
        setTitleValue(title);
        setQtuValue(qtu);
        setUomValue(uom);
    }, [title, qtu, uom]);

    const uoms = useSelector((state: RootState) => {
        return state.catalogSlice.uoms;
    })

    const handleSelectUOM = (uom: UOMItem | null) => {
        if (uom) {
            setUomValue(uom);
            setEdited(true);
        }
    };
    const checkUOMFilled = (uom: UOMItem|null): boolean => {
        // проверяем uom заполнен
        return ( uom !== null &&
            uom !== undefined &&
            uom.id !== undefined &&
            uom.title !== undefined &&
            uom.title.trim() !== ""
        );
    };
   
    return (
        <div key={id} className={styles.container_tCardProduct} >
            <div className={styles.container_row}>

                <input className={styles.tCardProduct_title}
                    id={"title" + id} autoComplete="off"
                    value={titleValue} type="text"
                    onChange={e => {
                        setTitleValue(e.target.value);
                        setEdited(true);
                    }} />

                <input className={styles.tCardProduct_qtu}
                    id={"qtu" + id} autoComplete="off"
                    value={qtuValue} type="number"
                    onChange={e => {
                        setQtuValue(Number(e.target.value));
                        setEdited(true);
                    }}
                />

                <DropdownSelectUOM
                    options={uoms}
                    onSelect={handleSelectUOM}
                    selectedValue={uomValue ? uomValue.id : null}
                />

            </div>
            <div className={styles.container_row}>
            <div className={styles.message}>{message}</div>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => {
                            if (uomValue!==null && checkUOMFilled(uomValue)){
                            setMessage("");
                            saveProductHandler(id, titleValue, qtuValue, uomValue)
                        } else {
                            setMessage("Заполните единицу измерения!");}
                        }}
                    />
                    {edited && <div>*</div>}
                </div>
                <Image className={styles.icon_del}
                    src={del} alt="del" width={20} height={20}
                    onClick={() => deleteProductHandler(id)}
                />
            </div>

        </div>
    )
}