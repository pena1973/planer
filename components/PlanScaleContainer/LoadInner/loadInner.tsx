
import styles from "./loadInner.module.scss";
import ContexMenu from "./ContextMenu/contextMenu";
import Image from 'next/image';
import { StatusEnum, UnitLoadItem, TCardItem, UnitItem } from "@/types";

import pinon from "@/public/pin_on2-rem.png";
import pinof from "@/public/pin_off2-rem.png";

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
    erazLoadHandler: (idc: number) => void,
    handleMouseDownOper: (e: React.MouseEvent<HTMLDivElement>, load: UnitLoadItem) => void,
    handleMouseUpOper: () => void,
    handleRightClickMenu: (event: React.MouseEvent, idc: number | undefined) => void,
    index: number,    
    pinLoadHandler: (load: UnitLoadItem,unit:UnitItem,date:string,timeStart:number,timeFinish:number)=>void
    unPinLoadHandler: (load: UnitLoadItem,unit:UnitItem,date:string,timeStart:number,timeFinish:number)=>void
    
}

export default function LoadInner({
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
    pinLoadHandler,
}: LoadProps) {

    let blockwidth = dayWidth / quants; //это ширина блока на 5 минут
    let shift = load.timeStart - intervTime; // сдвиг начала блока от начала интервала в минутах

    let left = blockwidth / 5 * shift; // тот же схвиг в пикселях
    let width = (load.timeFinish - load.timeStart) * blockwidth / 5; // длительность операции в пикселях           

    let intervalClass = `${styles.interval} ${styles.draft}`; // Класс по умолчанию

    switch (load.status) {
        case StatusEnum.draft:
            intervalClass = `${styles.interval} ${styles.draft}`; // Если статус "draft"
            break;
        case StatusEnum.planed:
            intervalClass = `${styles.interval} ${styles.planed}`; // Если статус "planed"
            break;
        case StatusEnum.prepared:
            intervalClass = `${styles.interval} ${styles.prepared}`; // Если статус "ready"
            break;
        case StatusEnum.defective:
            intervalClass = `${styles.interval} ${styles.faulty}`; // Бракованный
            break;
        default:
            intervalClass = `${styles.interval} ${styles.draft}`; // Класс по умолчанию для остальных статусов
            break;
    }
    intervalClass = load.isRetool ? `${intervalClass} ${styles.retool}` : intervalClass;

    // Выделяем операции текущей карты
    if (tCardLighted.id === load.id_tCard) intervalClass = `${intervalClass} ${styles.lighted}`
    let tCard = tCards.find(tCard => tCard.id === load.id_tCard);
    if (!tCard) tCard = {} as TCardItem;

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
                onContextMenu={(event) => handleRightClickMenu(event, load.idc)}>{`C${load.idc_oper}`}
            </div>

            {contectMenuShow === load.idc &&
                <ContexMenu
                    tCard={tCard}
                    load={load}
                    left={left}
                    width={width}
                    erazLoadHandler={erazLoadHandler}
                    retool={unitView.retool}
                />}
                
               { load.isPinned?

              <Image className={styles.icon_pin} src={pinon} alt="pinon"
                width={15} height={15} onClick={() => pinLoadHandler(load,unitView,load.date,load.timeStart,load.timeFinish)} />
              : <Image className={styles.icon_unpin} src={pinof} alt="pinof"
                width={15} height={15} onClick={() => pinLoadHandler(load,unitView,load.date,load.timeStart,load.timeFinish)} />}
        </>
    )
}