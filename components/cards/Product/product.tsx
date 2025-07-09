
import styles from "./product.module.scss";
import { UOMItem } from '@/types/types'

export interface ProductProps {
    idc: number,
    title: string,
    uom: UOMItem,
    sync: string,

}

export default function Product({
    idc,
    title,
    uom,
    sync,
}: ProductProps) {
    return (
        <div className={styles.container_row}>
            <div className={styles.idc} >{idc}</div>
            <div className={styles.title}>{title}</div>
            <div className={styles.uom}>{uom.title}</div>
            <div className={styles.sync}>{sync}</div>
        </div>

    )
}