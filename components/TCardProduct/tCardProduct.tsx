
import styles from "./tCardProduct.module.scss";
import { UOMItem } from '@/types'
import Image from 'next/image';

import del from "@/public/del2.png";
import edit from "@/public/edit-rem.png";

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

export interface TCardProductProps {
    id: number,
    title: string,
    qtu: number,
    uom: UOMItem,
    deleteProductHandler:  (id:number) =>void,
    editProductHandler: (id:number) =>void
}

export default function TCardProduct({
    id,
    title,
    qtu,
    uom,
    deleteProductHandler,
   editProductHandler
}: TCardProductProps) {
   
    return (
        <div key={id} className={styles.container_tCardProduct} >

           
            <div className={styles.container_row}>
                <div className={styles.tCardProduct_title}>{title}</div>
                <div className={styles.tCardProduct_qtu}>{qtu}</div>
                {(uom) &&<div className={styles.tCardProduct_uom}>{uom.title}</div>}
            </div>
            <div className={styles.container_buttons_row}>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={edit}
                        alt="arrow" width={20} height={20}
                        onClick={() => {editProductHandler(id)}}
                    />
                    
                </div>
                <Image className={styles.icon_del}
                    src={del} alt="del" width={20} height={20}
                    onClick={()=>deleteProductHandler(id)}
                />
            </div>
        </div>
    )
}