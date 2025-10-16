import styles from "./productNew.module.scss";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import { UOMItem } from '@/types/types'
import DropdownSelectUOM from '@/components/DropdownSelectUOM/dropdownSelectUOM';

import Image from 'next/image';
import del from "@/public/del2.png";

export interface ProductNewProps {
    idc: number,
    title: string,
    sync: string,
    uom: UOMItem | null,
    deleteProductHandler: (index: number, idc:number) => void,
    changeProductHandler: (index: number, title: string, sync: string, uom: UOMItem | null) => void,
    index: number
}

export default function ProductNew({
    idc,
    title,
    uom,
    sync,
    deleteProductHandler,
    changeProductHandler,
    index
}: ProductNewProps) {

    const [titleValue, setTitleValue] = useState("");
    const [syncValue, setSyncValue] = useState("");
    const [uomValue, setUomValue] = useState<UOMItem | null>(null);

    useEffect(() => {
        setTitleValue(title);
        setUomValue(uom);
        setSyncValue(sync);
    }, [title, sync, uom]);

    const uoms = useAppSelector((state: RootState) => {
        return state.catalogSlice.uoms;
    })

    const handleSelectUOM = (uom: UOMItem | null) => {
        if (uom) {
            setUomValue(uom);
            changeProductHandler(index, titleValue, sync, uom)
        }
    };

    return (

        <div className={styles.container_row}>
            <Image className={styles.icon_del}
                src={del} alt="del" width={20} height={20}
                onClick={() => deleteProductHandler(index,idc)}
            />
            <div className={styles.idc}>{idc}</div>
            <input className={styles.title}
                id={"title" + idc} autoComplete="off"
                value={titleValue} type="text"
                placeholder="title"
                onChange={e => {
                    setTitleValue(e.target.value);
                    changeProductHandler(index, e.target.value, sync, uomValue)
                }} />

            <DropdownSelectUOM
                options={uoms}
                onSelect={handleSelectUOM}
                selectedValue={uomValue ? uomValue.id : null}
            />

            <input className={styles.sync}
                id={"sync" + idc} autoComplete="off"
                placeholder="sync"
                value={syncValue} type="text"
                onChange={e => {
                    setSyncValue(e.target.value);
                    changeProductHandler(index, titleValue, e.target.value, uomValue)
                }}
            />


        </div>

    )
}