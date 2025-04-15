
import styles from "./loadOperProcess.module.scss";
import Image from 'next/image';
import { StatusEnum,  TCardOperationItem, TCardItem } from "@/types";
import { padNumberToFourDigits, } from "@/utils"

import cancel from "@/public/cancel.png";

export interface LoadOperProcessProps {
    containerHeight: number,
    oper: TCardOperationItem,
    isQualControl: boolean
    tCard: TCardItem,
    operInfo?: {
        title: string,
        duration: number,
        interruptible: boolean,
        koef: number,
        start: { date: string, time: number },
        finish: { date: string, time: number }
    },
    setOperStatusHandler: (status:StatusEnum) => void,    
    closeOperHandler: () => void,

}

export default function LoadOperProcess({
    containerHeight,
    oper,
    isQualControl,
    tCard,
    operInfo,
    setOperStatusHandler,   
    closeOperHandler,

}: LoadOperProcessProps) {

    const formatMinutes = (totalMinutes: number | undefined): string => {
        if (!totalMinutes) return "00-00";
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}-${minutes.toString().padStart(2, '0')}`;
    }
    let innReactNodes = [] as JSX.Element[];
    if (oper.inn) {
        innReactNodes = oper.inn.map((elem) => {
            return (
                <div className={styles.inn_line}>
                    <div className={styles.oper_title}>{elem.title} {elem.qtu} {elem.uom.title}</div>
                    <div className={styles.oper_title}> code:  {elem.codeS} </div>
                </div>
            )
        })
    }
    let outReactNodes = [] as JSX.Element[];
    if (oper.out) {
        outReactNodes = oper.out.map((elem) => {
            return (
                <div className={styles.inn_line}>
                    <div className={styles.oper_title}>{elem.title} {elem.qtu} {elem.uom.title}</div>
                    <div className={styles.oper_title}> code:  {elem.codeS} </div>
                </div>
            )
        })
    }
    const titleCard = `${padNumberToFourDigits(tCard.number)} - ${new Date(tCard.date).toLocaleDateString("en-CA")};`

    return (

        <div style={{ height: containerHeight }}

            className={styles.oper_container}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { closeOperHandler() }}
            />
            {/* Здесь будет отображаться информация о загруженной операции */}
            <div className={styles.oper_content_container}>
                <div className={styles.oper_title}>Card: {titleCard}</div>
                <div className={styles.oper_title}>Oper: C{oper.idc}, {operInfo?.title}, {oper.status}, {operInfo?.duration} мин</div>
                <div className={styles.oper_title}>Start: {operInfo?.start.date}: {formatMinutes(operInfo?.start.time)}</div>
                <div className={styles.oper_title}>Finish: {operInfo?.finish.date}: {formatMinutes(operInfo?.finish.time)}</div>
            </div>

            <div className={styles.oper_content}>

                <div className={styles.oper_content_container}>
                    <div className={styles.oper_title}><span className={styles.bold_text}>Result</span></div>
                    {outReactNodes}
                </div>
                <div className={styles.oper_content_container}>
                    <div className={styles.oper_title}><span className={styles.bold_text}>Task</span></div>
                    <div className={styles.oper_coment}>{(oper.coment) ? oper.coment : "нет коментариев"}</div>
                </div>

                <div className={styles.oper_content_container}>
                    <div className={styles.oper_title}><span className={styles.bold_text}>Source</span></div>
                    {innReactNodes}
                </div>

            </div>

            <div className={styles.button_container}>
                {isQualControl && oper.status === StatusEnum.planed && <button className={styles.button_perfotmed_top} onClick={() => setOperStatusHandler(StatusEnum.performed)}>Выполнен</button>}
                {!isQualControl && oper.status === StatusEnum.planed && <button className={styles.button_ready_top} onClick={() => setOperStatusHandler(StatusEnum.ready)}>Готов</button>}
                {!isQualControl && oper.status === StatusEnum.planed && <button className={styles.button_defected_top}onClick={() => setOperStatusHandler(StatusEnum.defective)}>Брак</button>}
                {/* {oper.status !== StatusEnum.planed
                    && <button onClick={() => closeOperHandler(oper.id as number)}>Закрыть</button>} */}
            </div>
        </div>

    )
}