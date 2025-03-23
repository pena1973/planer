
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
    erazLoadHandler: (idc: number) => void,
    handleMouseDownOper: (e: React.MouseEvent<HTMLDivElement>, load: UnitLoadItem) => void,
    handleMouseUpOper: () => void,
    handleRightClickMenu: (event: React.MouseEvent, idc: number | undefined) => void,
    // index: number,
    // isOuterStart: boolean,//  это старт оутсортера
    // isOuterFinish: boolean,//  это финиш оутсортера
    stopCloseMenu: (idc: number) => void,
    pinLoadHandler: (load: UnitLoadItem, unit: UnitItem, date: string, timeStart: number, timeFinish: number) => void,

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
    // index,
    // isOuterStart,
    // isOuterFinish,
    stopCloseMenu,
    pinLoadHandler,

}: LoadProps) {

    // let index = (isOuterStart) ? 1 : 2; // это либо конец либо начало

    // старт и финиш -маленькимй треугольничек сверху ли снизу и другое контекстноке меню
    //  ширина лоада 5 минут  -  стандартная для сьтарта и ждля финиша
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

    const saveLoadHandler = (
        load: UnitLoadItem,
        dateValue: string,
        timeStartValue: number,
        timeFinisValue: number) => {
        if (load.isOuterFinish)
            pinLoadHandler(load, unitView, dateValue, timeFinisValue - 5, timeFinisValue);
        if (load.isOuterStart) pinLoadHandler(load, unitView, dateValue, timeStartValue, timeStartValue + 5);
    }


    return (
        <>
            {/* Треугольник (стрелка) */}

            {/* <div className={styles.triangleTop} /> */}
            {load.isOuterFinish && <div className={styles.triangleLeft} />}
            {load.isOuterStart && <div className={styles.triangleRight} />}
            <div className={intervalClass}
                onMouseDown={e => handleMouseDownOper(e, load)}
                onMouseUp={e => handleMouseUpOper()}
                draggable={true}
                id={String(load.idc)}
                style={{
                    minWidth: '20px', maxWidth: '20px', width: `${width}px`, left: `${left}px`,
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
                    // width={width}
                    erazLoadHandler={erazLoadHandler}
                    retool={unitView.retool}
                    stopCloseMenu={stopCloseMenu}
                    saveLoadHandler={saveLoadHandler}
                />}
        </>
    )
}