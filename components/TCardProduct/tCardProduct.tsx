
import styles from "./tCardProduct.module.scss";
import { UOMItem } from '@/types'
// import Image from 'next/image';

// import del from "@/public/del2.png";
// import edit from "@/public/edit-rem.png";

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

export interface TCardProductProps { 
    idc: number,        
    codeS: string,
    title: string,
    qtu: number,
    uom: UOMItem,
    dragOverHandler: (e: React.DragEvent<HTMLElement>) => void,
    dropHandler: (e: React.DragEvent<HTMLElement>) => void,
    setCurrentDraggingElement: ({ }: string) => void,
    handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void,
    handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void,
    isDragging: boolean,
    currentDraggingElement: string,
    positionX: number,
    positionY: number,
    handleDrop: (e: React.DragEvent<HTMLDivElement>, target: string) => void,
    prefix:string,
    index:number    
}

export default function TCardProduct({    
    idc,        
    codeS,
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
    index
    
}: TCardProductProps) {
 const code = (prefix==="M")?codeS:`${prefix+idc} | ${codeS}`
 const codeWidth = (prefix==="M")?50:100
 const titleWidth = (prefix==="M")?140:80
    return (
        <div className={styles.container_row}
            onDragOver={(e) => dragOverHandler(e)}
            onDrop={(e) => dropHandler(e)}
            draggable={true}
            onMouseDown={(e) => {
                setCurrentDraggingElement(prefix+index);
                handleMouseDown(e)                
            }}
            onMouseLeave={handleMouseUp}
            style={{
                left: isDragging && (currentDraggingElement === prefix+idc) ? positionX : 0,
                top: isDragging && (currentDraggingElement === prefix+idc) ? positionY : 0,
                cursor: isDragging && (currentDraggingElement === prefix+idc) ? 'grabbing' : 'grab'
            }}>
            <div className={styles.tCardProduct_code} style={{minWidth:codeWidth}}>{code}</div>            
            <div className={styles.tCardProduct_title} style={{minWidth:titleWidth}}>{title}</div>
            <div className={styles.tCardProduct_qtu}>{qtu}</div>
            {(uom) && <div className={styles.tCardProduct_uom}>{uom.title}</div>}
        </div>

    )
}