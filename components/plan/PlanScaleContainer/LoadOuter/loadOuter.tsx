
import styles from "./loadOuter.module.scss";
import React from 'react';
import ContexMenuOuter from "./ContextMenuOuter/contextMenuOuter";

import { StatusEnum, UnitLoadItem, TCardItem, UnitItem } from "@/types/types";

// 🔹 общий helper: карта + операция + версия + тип точки (start/finish)
export const getOuterPointId = (load: UnitLoadItem, edge: 'start' | 'finish'): string => {
    return `outer-${edge}-${load.id_tCard}-${load.idc_oper}-${load.version}`;
};

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
    lightTCardHandler: (elem: TCardItem, lightOn: boolean) => void,

}

function LoadOuter({
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
    lightTCardHandler

}: LoadProps) {

    // старт и финиш -маленькимй треугольничек сверху ли снизу и другое контекстноке меню
    //  ширина лоада 5 минут  -  стандартная для сьтарта и ждля финиша
    // const blockwidth = dayWidth / quants; //это ширина блока на 5 минут
    // const shift = load.timeStart - intervTime; // сдвиг начала блока от начала интервала в минутах

    // const left = blockwidth / 5 * shift + (load.isOuterFinish ? -10 : 0); // тот же схвиг в пикселях

    // const width = (load.timeFinish - load.timeStart) * blockwidth / 5; // длительность операции в пикселях           

    // ширина одной 5-минутки
    const blockwidth = dayWidth / quants;
    const pxPerMin = blockwidth / 5;

    // пиксельные координаты левого и правого края интервала
    const xStartPx = (load.timeStart - intervTime) * pxPerMin;
    const xFinishPx = (load.timeFinish - intervTime) * pxPerMin;

    // ширина «хэндла» внешнего лоада = 1 квант (5 минут) на текущем масштабе
    const handlePx = blockwidth;

    // если нужно компенсировать визуальный бордер/скругление справа — подбери 0..2px
    const RIGHT_VISUAL_EPS = 0; // попробуй 0.5 или 1, если видишь микросдвиг

    // финальные координаты
    const left = load.isOuterFinish ? (xFinishPx - handlePx - RIGHT_VISUAL_EPS) : xStartPx;
    // const width = (load.isOuterFinish || load.isOuterStart)
    //     ? handlePx
    //     : (load.timeFinish - load.timeStart) * pxPerMin;


    let intervalClass = `${styles.interval} ${styles.draft}`; // Класс по умолчанию
    // const triangleRightClass = `${styles.triangleRight} ${styles.triangleRightDraft}`; // Класс по умолчанию
    // const triangleLeftClass = `${styles.triangleLeft} ${styles.triangleLeftDraft}`; // Класс по умолчанию

    switch (load.status) {
        case StatusEnum.planed:
            intervalClass = `${styles.interval} ${styles.planed}`; // Если статус "planed"                    
            break;
        case StatusEnum.prepared:
            intervalClass = `${styles.interval} ${styles.prepared}`; // Если статус "ready"            
            break;
        case StatusEnum.defective:
            intervalClass = `${styles.interval} ${styles.defected}`; // Бракованный            
            break;
        case StatusEnum.ready:
            intervalClass = `${styles.interval} ${styles.ready}`; // готовый
            break;
        case StatusEnum.performed:
            intervalClass = `${styles.interval} ${styles.performed}`; // получен от поставщика но не проверен
            break;
        case StatusEnum.cancelled:
            intervalClass = `${styles.interval} ${styles.cancelled}`; // отменен
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
        timeFinisValue: number
    ) => {
        if (load.isOuterFinish) {
            // двигаем только финиш, старт оставляем как есть
            moveLoadHandler(load, unitView, dateValue, load.timeStart, timeFinisValue);
        }
        if (load.isOuterStart) {
            // двигаем только старт, финиш оставляем как есть
            moveLoadHandler(load, unitView, dateValue, timeStartValue, load.timeFinish);
        }
    };

    // 🔹 id для точек начала/конца (по сборному ключу)
    // const startPointId = getOuterPointId(load, 'start');
    // const finishPointId = getOuterPointId(load, 'finish');
    const blocked = !(load.status === StatusEnum.prepared || load.status === StatusEnum.planed);
    return (
        <>
            {/* Треугольник (стрелка) */}

            {/* {load.isOuterFinish && <div className={triangleLeftClass} />}
            {load.isOuterStart && <div className={triangleRightClass} />} */}
            {/* Треугольники-стрелки старта/финиша */}
            {/* {load.isOuterFinish && (
                <div
                    id={finishPointId}                    // ⬅️ точка ФИНИША
                    className={triangleLeftClass}
                />
            )} */}
            {/* {load.isOuterStart && (
                <div
                    id={startPointId}                     // ⬅️ точка НАЧАЛА
                    className={triangleRightClass}
                />
            )} */}

            <div className={intervalClass}
                onMouseDown={e => handleMouseDownOper(e, load)}
                onMouseUp={e => handleMouseUpOper()}
                onDoubleClick={() => lightTCardHandler(tCard, true)}
                draggable={true}
                id={String(load.idc)}
                style={{
                    // width: `${width}px`,
                    // left: `${left}px`,

                    cursor: (draggingLoad === load) ? "grabbing" : "grab"
                }}

                onContextMenu={(event) => handleRightClickMenu(event, load.idc)}>{`A${load.idc_oper}`}
            </div>

            {contectMenuShow === load.idc &&
                <ContexMenuOuter
                    tCard={tCard}
                    load={load}
                    left={left}
                    erazLoadHandler={erazLoadHandler}
                    retool={unitView.retool}
                    stopCloseMenu={stopCloseMenu}
                    saveLoadHandler={saveLoadHandler}
                    blocked={blocked}
                />}
        </>
    )
}

function areEqualLoadOuter(prev: LoadProps, next: LoadProps) {
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
export default React.memo(LoadOuter, areEqualLoadOuter);