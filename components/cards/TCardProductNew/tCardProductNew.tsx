import { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState, 
    // useAppDispatch 
} from "@/pages/_app";
import styles from "./tCardProductNew.module.scss";
import { UOMItem } from '@/types/types'
import DropdownSelectUOM from '@/components/DropdownSelectUOM/dropdownSelectUOM';

import Image from 'next/image';

import del from "@/public/del2.png";
// import save from "@/public/save-rem.png";

// const URL = process.env.NEXT_PUBLIC_URL;
// let _url = String(URL);
// _url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

export interface TCardProductNewProps {
    idc: number,   
    prefix:string, 
    code: string,
    title: string,
    qtu: number,
    uom: UOMItem | null,
    deleteProductHandler: (index: number) => void,
    changeProductHandler: (index:number, id: number,  title: string, qtu: number, uom: UOMItem | null) => void,
    index:number
}

export default function TCardProductNew({
    idc,   
    prefix, 
    code,
    title,
    qtu,
    uom,
    deleteProductHandler,
    changeProductHandler,
    index
}: TCardProductNewProps) {

    // const [editMode, setEditMode] = useState(false);
    // const [edited, setEdited] = useState(false);

    const [titleValue, setTitleValue] = useState("");
    const [qtuValue, setQtuValue] = useState(0);
    const [uomValue, setUomValue] = useState<UOMItem | null>(null);

    // const [message, setMessage] = useState("");

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
            // setEdited(true);
            changeProductHandler(index,idc, titleValue, qtuValue, uom)
        }
    };

    return (

        <div className={styles.container_row}>
            <Image className={styles.icon_del}
                src={del} alt="del" width={20} height={20}
                onClick={() => deleteProductHandler(index)}
            />
            <div className={styles.tCardProduct_code}>{"P"+idc}|{code}</div>
            <input className={styles.tCardProduct_title}
                id={"title" + idc} autoComplete="off"
                value={titleValue} type="text"
                onChange={e => {
                    setTitleValue(e.target.value);
                    // setEdited(true);
                    changeProductHandler(index,idc, e.target.value, qtuValue, uomValue)
                }} />

            <input className={styles.tCardProduct_qtu}
                id={"qtu" + idc} autoComplete="off"
                value={qtuValue} type="number"
                onChange={e => {
                    setQtuValue(Number(e.target.value));
                    // setEdited(true);
                    changeProductHandler(index,idc, titleValue, Number(e.target.value), uomValue)
                }}
            />

            <DropdownSelectUOM
                options={uoms}
                onSelect={handleSelectUOM}
                selectedValue={uomValue ? uomValue.id : null}
            />

        </div>

    )
}