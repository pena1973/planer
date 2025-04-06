
import styles from "./loadOper.module.scss";
import Image from 'next/image';
import { StatusEnum, UnitLoadItem, TCardOperationItem, UnitItem, TCardItem } from "@/types";
import { formatDate, padNumberToFourDigits, ISOStringToLocalDateTime } from "@/utils"

import cancel from "@/public/cancel.png";

export interface LoadMonitorProps {
    containerHeight: number,
    oper: TCardOperationItem,
    isOTK: boolean
    tCard: TCardItem,
    operInfo?: {
        title: string,
        duration: number,
        interruptible: boolean,
        koef: number,
        start: { date: string, time: number },
        finish: { date: string, time: number }
    },
    performedOperHandler: (id_oper: number) => void,
    readyOperHandler: (id_oper: number) => void,
    defectOperHandler: (id_oper: number) => void,
    closeOperHandler: (id_oper: number) => void,

}

export default function LoadOper({
    containerHeight,
    oper,
    isOTK,
    tCard,
    operInfo,
    performedOperHandler,
    readyOperHandler,
    defectOperHandler,
    closeOperHandler,

}: LoadMonitorProps) {

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
                onClick={() => { closeOperHandler(oper.id as number) }}
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
                    <div className={styles.oper_title}><span className={styles.bold_text}>Входящие</span></div>
                    {innReactNodes}
                </div>

                <div className={styles.oper_content_container}>
                    <div className={styles.oper_title}><span className={styles.bold_text}>Задание</span></div>
                    <div className={styles.oper_coment}>{(oper.coment) ? oper.coment : "нет коментариев"}</div>
                </div>

                <div className={styles.oper_content_container}>
                    <div className={styles.oper_title}><span className={styles.bold_text}>Результат</span></div>
                    {outReactNodes}
                </div>


            </div>

            <div className={styles.button_container}>
                {isOTK && oper.status === StatusEnum.planed && <button onClick={() => performedOperHandler(oper.id as number)}>Выполнен</button>}
                {!isOTK && oper.status === StatusEnum.planed && <button onClick={() => readyOperHandler(oper.id as number)}>Готов</button>}
                {!isOTK && oper.status === StatusEnum.planed && <button onClick={() => defectOperHandler(oper.id as number)}>Брак</button>}
                {oper.status !== StatusEnum.planed
                    && <button onClick={() => closeOperHandler(oper.id as number)}>Закрыть</button>}
            </div>
        </div>

    )
}