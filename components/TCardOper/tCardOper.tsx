import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import styles from "./tCardOper.module.scss";
import { TCardOperationItem } from '@/types'
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
    handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void,
    handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void,
    isDragging: boolean,
    currentDraggingElement: string,
    positionX: number,
    positionY: number,
    handleDrop: (e: React.DragEvent<HTMLDivElement>, target: string) => void,
    // index: number
    deleteOperHandler:  (id:number) =>void,
    editOperHandler: (id:number) =>void
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
    editOperHandler
}: TCardOperProps) {
    const dispatch = useAppDispatch();

    let resultReactNodes;
    if (tCardOperation.out) {
        resultReactNodes = tCardOperation.out.map((elem2, index1) => {
            return (
                <div key={index1} className={styles.container_in_out_item}
                    onDragOver={(e) => dragOverHandler(e)}
                    onDrop={(e) => dropHandler(e)}
                    draggable={true}
                    onMouseDown={(e) => {
                        setCurrentDraggingElement(tCardOperation.id + "-" + index1);
                        handleMouseDown(e)
                    }}
                    onMouseLeave={handleMouseUp}
                    style={{

                        left: isDragging && (currentDraggingElement === tCardOperation.id + "-" + index1) ? positionX : 0,
                        top: isDragging && (currentDraggingElement === tCardOperation.id + "-" + index1) ? positionY : 0,
                        cursor: isDragging && (currentDraggingElement === tCardOperation.id + "-" + index1) ? 'grabbing' : 'grab'
                    }}>
                    <div className={styles.in_out_item_code}>{elem2.code}</div>
                    <div className={styles.in_out_item_qty}>{elem2.qtu}</div>
                    <div className={styles.in_out_item_uom}>{elem2.uom.title}</div>
                </div>
            )
        })
    }
    let sourceReactNodes;
    if (tCardOperation.inn) {
        sourceReactNodes = tCardOperation.inn.map((elem3, index2) => {
            return (
                <div key={index2} className={styles.container_in_out_item}
                    onDragOver={(e) => dragOverHandler(e)}
                    onDrop={(e) => dropHandler(e)}
                    draggable={true}
                    onMouseDown={(e) => {
                        setCurrentDraggingElement(tCardOperation.id + "-" + index2);
                        handleMouseDown(e)
                    }}
                    onMouseLeave={handleMouseUp}
                    style={{

                        left: isDragging && (currentDraggingElement === tCardOperation.id + "-" + index2) ? positionX : 0,
                        top: isDragging && (currentDraggingElement === tCardOperation.id + "-" + index2) ? positionY : 0,
                        cursor: isDragging && (currentDraggingElement === tCardOperation.id + "-" + index2) ? 'grabbing' : 'grab'
                    }}
                >
                    <div className={styles.in_out_item_code}>{elem3.code}</div>
                    <div className={styles.in_out_item_qty}>{elem3.qtu}</div>
                    <div className={styles.in_out_item_uom}>{elem3.uom.title}</div>

                </div>
            )
        })
    }

    return (
        <div className={styles.container_tCardOper} >
            <div className={styles.container_tCardOper_body}>
                {/* <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={editMode ? save : edit}
                        alt="arrow" width={20} height={20}
                        onClick={() => setEditMode(!editMode)}
                    />
                    {edited && <div>*</div>}
                </div> */}
                <div className={styles.container_tCardOper_out}>
                    <div className={styles.tCardOper_out_title}>result</div>
                    <div className={styles.tCardOper_out}
                        onDrop={(e) => {
                            //  handleDrop(e, 'Target 1') 
                        }}
                        onDragOver={(e) => e.preventDefault()} // Обязательно для возможности сброса
                    >
                        {resultReactNodes}
                    </div>
                </div>
                <div className={styles.container_tCardOper_action}>
                    <div className={styles.tCardOper_action_title}>action</div>
                    <div className={styles.tCardOper_action}>
                        
                        <div className={styles.tCardOper_oper_title}>{tCardOperation.action.title}</div>
                        <div className={styles.tCardOper_oper_qtu}>{tCardOperation.duration} ms</div>
                    </div>
                </div>
                <div className={styles.container_tCardOper_in}>
                    <div className={styles.tCardOper_in_title}>sourse</div>
                    <div className={styles.tCardOper_in}>
                        {sourceReactNodes}
                    </div>
                </div>
            </div>
            <div className={styles.container_buttons_row}>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={edit}
                        alt="arrow" width={20} height={20}
                    onClick={() => { editOperHandler(tCardOperation.id) }}
                    />

                </div>
                <Image className={styles.icon_del}
                    src={del} alt="del" width={20} height={20}
                onClick={() => deleteOperHandler(tCardOperation.id)}
                />
            </div>

        </div>
    )
}