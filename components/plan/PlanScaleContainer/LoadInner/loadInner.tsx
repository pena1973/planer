import React, { useState } from "react";
import { UnitLoadItem, TCardItem, UnitItem, StatusEnum } from "@/types/types";
import styles from "./loadInner.module.scss";
import Image from "next/image";
import pinon from "@/public/point-rem.png";
import pinof from "@/public/pin_of-rem.png";
import ContextMenuInner from "./ContextMenuInner/contextMenuInner";
import { padNumberToFourDigits } from "@/lib/utils";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

export interface LoadProps {
    dayWidth: number,
    quants: number,
    intervTime: number,
    load: UnitLoadItem,
    tCardLighted: TCardItem,
    tCards: TCardItem[],
    draggingLoad: UnitLoadItem | undefined,
    contectMenuShow: number,
    unitView: UnitItem,
    erazLoadHandler: (load_idc: number) => void,
    handleDragStart: (e: React.DragEvent<HTMLDivElement>, load: UnitLoadItem) => void,
    handleMouseUpOper: () => void,
    handleRightClickMenu: (event: React.MouseEvent, idc: number | undefined) => void,
    index: number,
    //   moveLoadHandler: (load: UnitLoadItem, unit: UnitItem, date: string, timeStart: number, timeFinish: number) => void,
    pinLoadHandler: (oper_id: number, version:number) => void,
    unPinLoadHandler: (oper_id: number, tCardId: number, version:number) => void,
    isLoadingDrop?: boolean
}

function LoadInner({
    dayWidth,
    quants,
    intervTime,
    load,
    tCardLighted,
    tCards,    
    contectMenuShow,
    unitView,
    erazLoadHandler,
    handleDragStart,
    handleMouseUpOper,
    handleRightClickMenu,
    index,
    pinLoadHandler,
    unPinLoadHandler,
    isLoadingDrop
}: LoadProps) {

    const [isMouseDown, setIsMouseDown] = useState(false);

    const blockwidth = dayWidth / quants;
    const shift = load.timeStart - intervTime;
    const left = blockwidth / 5 * shift;
    const width = (load.timeFinish - load.timeStart) * blockwidth / 5;

    let intervalClass = `${styles.interval} ${styles.draft}`;

    switch (load.status) {
        case StatusEnum.planed:
            intervalClass = `${styles.interval} ${styles.planed}`;
            break;
        case StatusEnum.prepared:
            intervalClass = `${styles.interval} ${styles.prepared}`;
            break;
        case StatusEnum.cancelled:
            intervalClass = `${styles.interval} ${styles.cancelled}`;
            break;
        case StatusEnum.performed:
            intervalClass = `${styles.interval} ${styles.performed}`;
            break;
        case StatusEnum.ready:
            intervalClass = `${styles.interval} ${styles.ready}`;
            break;
        case StatusEnum.defective:
            intervalClass = `${styles.interval} ${styles.defected}`;
            break;
        default:
            intervalClass = `${styles.interval} ${styles.draft}`;
            break;
    }

    if (!load.loadInfo?.interruptible) intervalClass = `${intervalClass} ${styles.strip}`;
    if (load.isRetool) intervalClass = `${intervalClass} ${styles.retool}`;
    if (tCardLighted.id === load.id_tCard) intervalClass = `${intervalClass} ${styles.lighted}`;

    const tCard = tCards.find(tCard => tCard.id === load.id_tCard) || {} as TCardItem;
    const blocked = !(load.status === StatusEnum.prepared || load.status === StatusEnum.planed);
    const tCardIdc = load.loadInfo?.tCardIdc ?? 0;
    const tCardDate = load.loadInfo?.tCardDate ?? "";

    return (
        <>
            {(isLoadingDrop) && !load.isRetool && (
                <div className={styles.loadingOverlay}>
                    <ButtonLoader width={10} height={10} /> Проверка возможности...
                </div>
            )}

            <div
                className={intervalClass}
                onDragStart={(e) => handleDragStart(e, load)}
                onMouseUp={handleMouseUpOper}
                onDragEnd={() => { setIsMouseDown(false) }}
                onMouseDown={() => setIsMouseDown(true)}
                draggable
                id={String(load.idc + "_" + index)}
                style={{
                    width: `${width}px`,
                    left: `${left}px`,
                    cursor: isMouseDown ? "grabbing" : "grab"
                }}
                onContextMenu={(event) => handleRightClickMenu(event, load.idc)}
            >
                {!load.isRetool && (
                    <div style={{ position: 'relative', width: '100%', maxWidth: '7px', height: '17px', marginTop: '-5px' }}>

                        {load.status === StatusEnum.prepared && load.isPinned &&
                            <Image
                                className={styles.icon_pinon}
                                src={pinon}
                                alt="pinon"
                                width={15}
                                height={15}
                                onClick={() => unPinLoadHandler(load.id_oper, load.id_tCard, load.version)}
                            />}


                        {load.status === StatusEnum.prepared && !load.isPinned &&
                            <Image
                                className={styles.icon_pinof}
                                src={pinof}
                                alt="pinof"
                                width={15}
                                height={15}
                                onClick={() => pinLoadHandler(load.id_oper, load.version)}
                            />}

                    </div>
                )}
                {!load.isRetool && load.isFirst && <div className={styles.first}></div>}
                {!load.isRetool && width >= 140 && `${padNumberToFourDigits(tCardIdc)} - ${tCardDate} / A${load.idc_oper}`}
                {!load.isRetool && width < 140 && width > 20 && `A${load.idc_oper}`}
            </div>

            {contectMenuShow === load.idc && (
                <ContextMenuInner                    
                    load={load}
                    left={left}
                    width={width}
                    erazLoadHandler={erazLoadHandler}
                    retool={unitView.retool}
                    blocked={blocked}
                />
            )}
        </>
    );
}

function areEqualLoadInner(prev: LoadProps, next: LoadProps) {
    return (
        prev.load.idc === next.load.idc &&
        prev.load.status === next.load.status &&
        prev.dayWidth === next.dayWidth &&
        prev.draggingLoad?.idc === next.draggingLoad?.idc &&
        prev.contectMenuShow === next.contectMenuShow &&
        prev.tCardLighted.id === next.tCardLighted.id &&
        prev.unitView.id === next.unitView.id &&
        prev.intervTime === next.intervTime &&
        prev.load.isPinned === next.load.isPinned
    );
}

export default React.memo(LoadInner, areEqualLoadInner);
