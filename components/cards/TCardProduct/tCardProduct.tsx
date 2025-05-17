
import styles from "./tCardProduct.module.scss";
import { UOMItem, StatusEnum } from '@/types'

import { StatusCircle } from "@/components/cards/StatusCircle/statusCircle";
// import Image from 'next/image';

// import del from "@/public/del2.png";
// import edit from "@/public/edit-rem.png";

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

export interface TCardProductProps {
    idc: number,
    code: string,
    title: string,
    qtu: number,
    uom: UOMItem,
    dragOverHandler: (e: React.DragEvent<HTMLElement>) => void,
    dropHandler: (e: React.DragEvent<HTMLElement>) => void,
    setCurrentDraggingElement: ({ }: string) => void,
    handleMouseDown: (code: string) => void,
    handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void,
    isDragging: boolean,
    currentDraggingElement: string,
    positionX: number,
    positionY: number,
    handleDrop: (e: React.DragEvent<HTMLDivElement>, target: string) => void,
    prefix: string,
    index: number,
    lightProduct: number,
    status: StatusEnum | undefined
}

export default function TCardProduct({
    idc,
    code,
    title,
    qtu,
    uom,
    dragOverHandler,
    dropHandler,
    setCurrentDraggingElement,
    handleMouseDown,
    handleMouseUp,
    isDragging,
    currentDraggingElement,
    positionX,
    positionY,
    prefix,
    index,
    lightProduct,
    status,

}: TCardProductProps) {

    const code1 = (prefix === "M") ? code : `${prefix + idc} | ${code}`
    const codeWidth = (prefix === "M") ? 50 : 100
    const titleWidth = (prefix === "M") ? 140 : 80
    return (
        <div className={styles.container_row}
            onDragOver={(e) => dragOverHandler(e)}
            onDrop={(e) => dropHandler(e)}
            draggable={true}
            onMouseDown={(e) => {
                // использую индекс поскольку могут быть строки с одинаковым idc
                // может быть P1,W1,M1 
                setCurrentDraggingElement(prefix + index);
                handleMouseDown(prefix + index)
            }}
            onMouseLeave={handleMouseUp}
            onMouseUp={handleMouseUp}
            style={{
                left: isDragging && (currentDraggingElement === prefix + index) ? positionX : 0,
                top: isDragging && (currentDraggingElement === prefix + index) ? positionY : 0,
                cursor: isDragging && (currentDraggingElement === prefix + index) ? 'grabbing' : 'grab',
                color: (lightProduct === idc) ? 'rgb(209, 29, 29)' : '',
            }}>

            <div className={styles.tCardProduct_status} >
                {(status) && <StatusCircle status={status} />}
            </div>
            <div className={styles.tCardProduct_code} style={{ width: codeWidth }}>{code1}</div>
            <div className={styles.tCardProduct_title} style={{ width: titleWidth }}>{title}</div>
            <div className={styles.tCardProduct_qtu}>{qtu}</div>
            
            <div className={styles.tCardProduct_uom}>{uom.title}</div>
        </div>

    )
}