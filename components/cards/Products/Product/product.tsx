
import styles from "./product.module.scss";
import { UOMItem } from '@/types/types'

export interface ProductProps {
    idc: number,
    title: string,
    uom: UOMItem,
    sync: string,
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

}

export default function Product({
    idc,
    title,
    uom,
    sync,
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
}: ProductProps) {
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
                color: (lightProduct === idc) ? 'rgb(25, 130, 25)' : '',
            }}>
            <div className={styles.idc} >{idc}</div>
            <div className={styles.title}>{title}</div>
            <div className={styles.uom}>{uom.title}</div>
            <div className={styles.sync}>{sync}</div>
        </div>

    )
}