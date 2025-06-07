
import styles from "./loadOuter.module.scss";
import ContexMenu from "./ContextMenuOuter/contextMenuOuter";

import { StatusEnum, UnitLoadItem, TCardItem, UnitItem } from "@/types";
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
    stopCloseMenu: (idc: number) => void,
    moveLoadHandler: (load: UnitLoadItem, unit: UnitItem, date: string, timeStart: number, timeFinish: number) => void,

}

export default function LoadOuter({
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

    stopCloseMenu,
    moveLoadHandler,

}: LoadProps) {
  
    // старт и финиш -маленькимй треугольничек сверху ли снизу и другое контекстноке меню
    //  ширина лоада 5 минут  -  стандартная для сьтарта и ждля финиша
    let blockwidth = dayWidth / quants; //это ширина блока на 5 минут
    let shift = load.timeStart - intervTime; // сдвиг начала блока от начала интервала в минутах

    let left = blockwidth / 5 * shift+ (load.isOuterFinish?-26:0); // тот же схвиг в пикселях
    let width = (load.timeFinish - load.timeStart) * blockwidth / 5; // длительность операции в пикселях           

    let intervalClass = `${styles.interval} ${styles.draft}`; // Класс по умолчанию
     let triangleRightClass = `${styles.triangleRight} ${styles.triangleRightDraft}`; // Класс по умолчанию
     let triangleLeftClass = `${styles.triangleLeft} ${styles.triangleLeftDraft}`; // Класс по умолчанию

    switch (load.status) {
        case StatusEnum.planed:
            intervalClass = `${styles.interval} ${styles.planed}`; // Если статус "planed"
            // triangleRightClass = `${styles.triangleRight} ${styles.triangleRightPlaned}`; // Класс по умолчанию
            // triangleLeftClass = `${styles.triangleLeft} ${styles.triangleLeftPlaned}`; // Класс по умолчанию                
             break;
        case StatusEnum.prepared:
            intervalClass = `${styles.interval} ${styles.prepared}`; // Если статус "ready"
            // triangleRightClass = `${styles.triangleRight} ${styles.triangleRightPrepared}`; // Класс по умолчанию
            // triangleLeftClass = `${styles.triangleLeft} ${styles.triangleLeftPrepared}`; // Класс по умолчанию                
             break;
        case StatusEnum.defective:
            intervalClass = `${styles.interval} ${styles.faulty}`; // Бракованный
            // triangleRightClass = `${styles.triangleRight} ${styles.triangleRightDefected}`; // Класс по умолчанию
            // triangleLeftClass = `${styles.triangleLeft} ${styles.triangleLeftDefected}`; // Класс по умолчанию                
             break;
        case StatusEnum.ready:
            intervalClass = `${styles.interval} ${styles.ready}`; // готовый
            // triangleRightClass = `${styles.triangleRight} ${styles.triangleRightReady}`; // Класс по умолчанию
            // triangleLeftClass = `${styles.triangleLeft} ${styles.triangleLeftReady}`; // Класс по умолчанию                
            break;
        case StatusEnum.performed:
            intervalClass = `${styles.interval} ${styles.performed}`; // получен от поставщика но не проверен
            // triangleRightClass = `${styles.triangleRight} ${styles.triangleRightPerformed}`; // Класс по умолчанию
            // triangleLeftClass = `${styles.triangleLeft} ${styles.triangleLeftPerformed}`; // Класс по умолчанию                
            break;
        case StatusEnum.cancelled:
            intervalClass = `${styles.interval} ${styles.cancelled}`; // отменен
            // triangleRightClass = `${styles.triangleRight} ${styles.triangleRightСancelled}`; // Класс по умолчанию
            // triangleLeftClass = `${styles.triangleLeft} ${styles.triangleLeftСancelled}`; // Класс по умолчанию                

            break;
        default:
            break;
    }
    intervalClass = load.isRetool ? `${intervalClass} ${styles.retool}` : intervalClass;

    // Выделяем операции текущей карты
    if (tCardLighted.id === load.id_tCard) intervalClass = `${intervalClass} ${styles.lighted}`
    let tCard = tCards.find(tCard => tCard.id === load.id_tCard);
    if (!tCard) tCard = {} as TCardItem;

    const saveLoadHandler = (
        load: UnitLoadItem,
        dateValue: string,
        timeStartValue: number,
        timeFinisValue: number) => {
        if (load.isOuterFinish)
            moveLoadHandler(load, unitView, dateValue, timeFinisValue - 5, timeFinisValue);
        if (load.isOuterStart) moveLoadHandler(load, unitView, dateValue, timeStartValue, timeStartValue + 5);
    }


    return (
        <>
            {/* Треугольник (стрелка) */}
            
            {load.isOuterFinish && <div className={triangleLeftClass} />}
            {load.isOuterStart && <div className={triangleRightClass} />}
            <div className={intervalClass}
                onMouseDown={e => handleMouseDownOper(e, load)}
                onMouseUp={e => handleMouseUpOper()}
                draggable={true}
                id={String(load.idc)}
                style={{
                    minWidth: '30px', maxWidth: '30px', width: `${width}px`, left: `${left}px`,
                    cursor: (draggingLoad === load) ? "grabbing" : "grab"
                }
                }
                onContextMenu={(event) => handleRightClickMenu(event, load.idc)}>{`A${load.idc_oper}`}
            </div>

            {contectMenuShow === load.idc &&
                <ContexMenu
                    tCard={tCard}
                    load={load}
                    left={left}                    
                    erazLoadHandler={erazLoadHandler}
                    retool={unitView.retool}
                    stopCloseMenu={stopCloseMenu}
                    saveLoadHandler={saveLoadHandler}
                />}
        </>
    )
}