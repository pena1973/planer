
import styles from "./loadInner.module.scss";
import React from 'react';
import Image from 'next/image';
import { StatusEnum, UnitLoadItem, TCardItem, UnitItem } from "@/types/types";

// import pinon from "@/public/pin_on-rem.png";
import pinon from "@/public/point-rem.png";
import pinof from "@/public/pin_of-rem.png";
import ContextMenuInner from "./ContextMenuInner/contextMenuInner";
import { relative } from "path";
import { padNumberToFourDigits } from "@/lib/utils"

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
    handleMouseDownOper: (e: React.MouseEvent<HTMLDivElement>, load: UnitLoadItem) => void,
    handleMouseUpOper: () => void,
    handleRightClickMenu: (event: React.MouseEvent, idc: number | undefined) => void,
    index: number,
    moveLoadHandler: (load: UnitLoadItem, unit: UnitItem, date: string, timeStart: number, timeFinish: number) => void,
    pinLoadHandler: (oper_id: number) => void,
    unPinLoadHandler: (oper_id: number, tCardId: number) => void,

}

  function LoadInner({
    dayWidth,
    quants,
    intervTime,
    load,
    tCardLighted,
    tCards,
    draggingLoad,
    contectMenuShow,
    unitView,
    erazLoadHandler,
    handleMouseDownOper,
    handleMouseUpOper,
    handleRightClickMenu,
    index,
    moveLoadHandler,
    pinLoadHandler,
    unPinLoadHandler
}: LoadProps) {

    const blockwidth = dayWidth / quants; //это ширина блока на 5 минут
    const shift = load.timeStart - intervTime; // сдвиг начала блока от начала интервала в минутах

    const left = blockwidth / 5 * shift; // тот же схвиг в пикселях
    const width = (load.timeFinish - load.timeStart) * blockwidth / 5; // длительность операции в пикселях           

    let intervalClass = `${styles.interval} ${styles.draft}`; // Класс по умолчанию


    switch (load.status) {
        case StatusEnum.draft:
            intervalClass = `${styles.interval} ${styles.draft}`; // Если статус "draft"
            break;
        case StatusEnum.planed:
            intervalClass = `${styles.interval} ${styles.planed}`; // Если статус "planed"
            break;
        case StatusEnum.prepared:
            intervalClass = `${styles.interval} ${styles.prepared}`; // Если статус "prepared"
            break;
        case StatusEnum.cancelled:
            intervalClass = `${styles.interval} ${styles.cancelled}`; // Если статус "cancelled"
            break;
        case StatusEnum.performed:
            intervalClass = `${styles.interval} ${styles.performed}`; // Если статус "performed"
            break;
        case StatusEnum.ready:
            intervalClass = `${styles.interval} ${styles.ready}`; // Если статус "ready"
            break;
        case StatusEnum.defective:
            intervalClass = `${styles.interval} ${styles.defected}`; // Бракованный
            break;
        default:
            intervalClass = `${styles.interval} ${styles.draft}`; // Класс по умолчанию для остальных статусов
            break;
    }
    // если операция не прерываемая
    if (!load.loadInfo?.interruptible) intervalClass = `${intervalClass} ${styles.strip}`

    intervalClass = load.isRetool ? `${intervalClass} ${styles.retool}` : intervalClass;

    // Выделяем операции текущей карты
    if (tCardLighted.id === load.id_tCard) intervalClass = `${intervalClass} ${styles.lighted}`
    let tCard = tCards.find(tCard => tCard.id === load.id_tCard);
    if (!tCard) tCard = {} as TCardItem;

    const blocked = !(load.status === StatusEnum.prepared || load.status === StatusEnum.planed); // запрет смены статуса
    const tCardIdc = (!load.loadInfo) ? 0 : load.loadInfo.tCardIdc;
    const tCardDate = (!load.loadInfo) ? "" : load.loadInfo.tCardDate;

    return (
        <>
            <div className={intervalClass}
                onMouseDown={e => handleMouseDownOper(e, load)}
                onMouseUp={e => handleMouseUpOper()}
                draggable={true}
                id={String(load.idc + "_" + index)}
                style={{
                    width: `${width}px`, left: `${left}px`,
                    cursor: (draggingLoad === load) ? "grabbing" : "grab"
                }
                }
                onContextMenu={(event) => handleRightClickMenu(event, load.idc)}>

                {!load.isRetool && <div style={{ 'position': 'relative', 'width': '100%', maxWidth: '7px', height: '17px', marginTop: '-5px' }}>
                    {load.status === StatusEnum.prepared && (load.isPinned ?

                        <Image className={styles.icon_pinon} src={pinon} alt="pinon"
                            width={15} height={15} onClick={() => { if (load.status === StatusEnum.prepared) unPinLoadHandler(load.id_oper, load.id_tCard) }} />
                        : <Image className={styles.icon_pinof} src={pinof} alt="pinof"
                            width={15} height={15} onClick={() => { if (load.status === StatusEnum.prepared) pinLoadHandler(load.id_oper) }}
                        />
                    )}
                </div>}
                {!load.isRetool && load.isFirst && <div className={styles.first}></div>}
                {(!load.isRetool && width >= 140) ? `${padNumberToFourDigits(tCardIdc)} - ${tCardDate} / A${load.idc_oper}` : ""}
                {(!load.isRetool && width < 140 && width > 20) ? `A${load.idc_oper}` : ""}
            </div>

            {contectMenuShow === load.idc &&
                <ContextMenuInner
                    tCard={tCard}
                    load={load}
                    left={left}
                    width={width}
                    erazLoadHandler={erazLoadHandler}
                    retool={unitView.retool}
                    blocked={blocked}
                />}


        </>
    )
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
    prev.intervTime === next.intervTime
  );
}

export default React.memo(LoadInner, areEqualLoadInner);