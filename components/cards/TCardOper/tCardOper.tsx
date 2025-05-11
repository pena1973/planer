import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import styles from "./tCardOper.module.scss";
import { TCardOperationItem, StatusEnum } from '@/types'
import { convertMillisecondsToTime, convertTimeToMilliseconds } from '@/utils'
import { StatusCircle } from "@/components/cards/StatusCircle/statusCircle";
import {

} from '@/store/slices';

import Image from 'next/image';

import save from "@/public/save-rem.png";
import edit from "@/public/edit-rem.png";
import del from "@/public/del2.png";


import { useRouter, usePathname } from 'next/navigation';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

export interface TCardOperProps {
    tCardOperation: TCardOperationItem;
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
    // index: number
    deleteOperHandler: (id: number) => void,
    editOperHandler: (id: number) => void
    setOperStatus: (id: number, status: StatusEnum) => void,
    lightProduct: number
}

export default function TCardOper({
    tCardOperation,
    dragOverHandler,
    dropHandler,
    setCurrentDraggingElement,
    handleMouseDown,
    handleMouseUp,
    isDragging,
    currentDraggingElement,
    positionX,
    positionY,
    handleDrop,
    // index,
    deleteOperHandler,
    editOperHandler,
    setOperStatus,
    lightProduct
}: TCardOperProps) {
    const dispatch = useAppDispatch();

    let outReactNodes;
    if (tCardOperation.out) {
        outReactNodes = tCardOperation.out.map((elem2, index1) => {
            return (
                <div key={index1} className={styles.container_in_out_item}
                    onDragOver={(e) => dragOverHandler(e)}
                    onDrop={(e) => dropHandler(e)}
                    draggable={true}
                    onMouseDown={(e) => {
                        e.stopPropagation(); // Останавливаем распространение события на родительский элемент
                        setCurrentDraggingElement("A" + tCardOperation.idc + "O" + index1);
                        handleMouseDown("A" + tCardOperation.idc + "O" + index1)
                    }}
                    onMouseLeave={handleMouseUp}
                    onMouseUp={handleMouseUp}
                    style={{

                        left: isDragging && (currentDraggingElement === "A" + tCardOperation.idc + "O" + index1) ? positionX : 0,
                        top: isDragging && (currentDraggingElement === "A" + tCardOperation.idc + "O" + index1) ? positionY : 0,
                        cursor: isDragging && (currentDraggingElement === "A" + tCardOperation.idc + "O" + index1) ? 'grabbing' : 'grab',
                        color: (lightProduct === elem2.idc) ? 'rgb(209, 29, 29)' : '',
                    }}>
                    <div className={styles.in_out_item_code}>{elem2.codeS}</div>
                    <div className={styles.in_out_item_title}>{elem2.title}</div>
                    <div className={styles.in_out_item_qty}>{elem2.qtu}</div>
                    <div className={styles.in_out_item_uom}>{elem2.uom.title}</div>
                </div>
            )
        })
    }
    let innReactNodes;
    if (tCardOperation.inn) {
        innReactNodes = tCardOperation.inn.map((elem3, index2) => {
            return (
                <div key={index2} className={styles.container_in_out_item}
                    onDragOver={(e) => dragOverHandler(e)}
                    onDrop={(e) => dropHandler(e)}
                    draggable={true}
                    onMouseDown={(e) => {   
                        e.stopPropagation(); // Останавливаем распространение события на родительский элемент                     
                        setCurrentDraggingElement("A" + tCardOperation.idc + "I" + index2);
                        handleMouseDown("A" + tCardOperation.idc + "I" + index2)
                    }}
                    onMouseLeave={handleMouseUp}
                    onMouseUp={handleMouseUp}
                    style={{

                        left: isDragging && (currentDraggingElement === "A" + tCardOperation.idc + "I" + index2) ? positionX : 0,
                        top: isDragging && (currentDraggingElement === "A" + tCardOperation.idc + "I" + index2) ? positionY : 0,
                        cursor: isDragging && (currentDraggingElement === "A" + tCardOperation.idc + "I" + index2) ? 'grabbing' : 'grab',
                        color: (lightProduct === elem3.idc) ? 'rgb(209, 29, 29)' : '',
                    }}
                >
                    <div className={styles.in_out_item_code}>{elem3.codeS}</div>
                    <div className={styles.in_out_item_title}>{elem3.title}</div>
                    <div className={styles.in_out_item_qty}>{elem3.qtu}</div>
                    <div className={styles.in_out_item_uom}>{elem3.uom.title}</div>

                </div>
            )
        })
    }

    const { hours, minutes, seconds, milliseconds } = convertMillisecondsToTime(tCardOperation.duration);
    return (
        <div className={styles.container}
             onDragOver={(e) => dragOverHandler(e)}        
             onDrop={(e) => { handleDrop(e, `S${tCardOperation.stage.idc}T${tCardOperation.idc}`) }}

             draggable={true}
             onMouseDown={(e) => {
                 setCurrentDraggingElement("T" + tCardOperation.idc);
                 handleMouseDown("T" + tCardOperation.idc)
             }}
             onMouseLeave={handleMouseUp}
             onMouseUp={handleMouseUp}
            style={{
                left: isDragging && (currentDraggingElement === "T" + tCardOperation.idc) ? positionX : 0,
                top: isDragging && (currentDraggingElement === "T" + tCardOperation.idc) ? positionY : 0,
                cursor: isDragging && (currentDraggingElement === "T" + tCardOperation.idc) ? 'grabbing' : 'grab',                
            }}
        >
            <div className={styles.container_header}>
                <div className={styles.container_status}>
                    <StatusCircle status={tCardOperation.status} />
                    &nbsp;
                    {tCardOperation.status}
                </div>
                Action {tCardOperation.idc}
                <div className={styles.plug}></div>
            </div>
            <div className={styles.container_tables}>
                <div className={styles.container_out}>
                    <div className={styles.out_title}>result</div>
                    <div className={styles._out}
                        onDrop={(e) => { handleDrop(e, `A${tCardOperation.idc}O`) }}
                        onDragOver={(e) => e.preventDefault()} // Обязательно для возможности сброса
                    >
                        {outReactNodes}
                    </div>
                </div>
                <div className={styles.container_action}>
                    <div className={styles.action_title}>action</div>
                    <div className={styles._action}>
                        <div className={styles._oper_title}>{tCardOperation.action.title}</div>
                        <div className={styles._oper_qtu}>{`${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`}</div>
                    </div>
                </div>
                <div className={styles.container_in}>
                    <div className={styles.in_title}>sourse</div>
                    <div className={styles._in}
                        onDrop={(e) => { handleDrop(e, `A${tCardOperation.idc}I`) }}
                        onDragOver={(e) => e.preventDefault()} // Обязательно для возможности сброса
                    >
                        {innReactNodes}
                    </div>
                </div>
            </div>
            <div className={styles.container_coment}>
                <div className={styles.coment_title}>comment</div>
                <div className={styles._coment}>
                    {tCardOperation.coment}
                </div>
            </div>
            <div className={styles.container_buttons_row}>
                <div>
                    {(tCardOperation.status === StatusEnum.draft)
                        && <button className={styles.button_status}
                            onClick={() => setOperStatus(tCardOperation.idc, StatusEnum.prepared)}>
                            на планирование
                        </button>}</div>

                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={edit}
                        alt="arrow" width={20} height={20}
                        onClick={() => { editOperHandler(tCardOperation.idc) }}
                    />
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteOperHandler(tCardOperation.idc)}
                    />
                </div>

            </div>

        </div>
    )
}