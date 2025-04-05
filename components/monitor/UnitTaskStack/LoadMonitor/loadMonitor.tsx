
import styles from "./loadMonitor.module.scss";
import Image from 'next/image';
import { StatusEnum, UnitLoadItem, TCardItem, UnitItem } from "@/types";

export interface LoadMonitorProps {
    loadHeight: number,
    showTitle: boolean,
    load: UnitLoadItem,
    titleCard: string,
    // durationOper: number, // в минутах
    // performLoadHandler: (load_idc: number) => void,
    // readyLoadHandler: (load_idc: number) => void,
    // defectLoadHandler: (load_idc: number) => void,
    openOperHandler: (id_oper: number,id_tCard: number) => void,
    index: number,
}

export default function LoadMonitor({
    loadHeight,
    showTitle,
    load,
    titleCard,
    // durationOper,
    // performLoadHandler,
    // readyLoadHandler,
    // defectLoadHandler,
    openOperHandler,
    index: number,
}: LoadMonitorProps) {

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
    // loadInfo?:{title:string,duration:number,interruptible:boolean,koef:number},
    return (

        <div className={intervalClass}
            id={String(load.idc)}
            style={{ height: `${loadHeight}px` }}
            onClick={(event) => {
                openOperHandler(load.id_oper,load.id_tCard); // обработчик клика по операции
            }}
            onContextMenu={(event) => {
                event.preventDefault(); // предотвращаем стандартное контекстное меню                    
            }}
        >
            {showTitle && <div>Card: {titleCard} </div>}
            {showTitle && <div> Oper: C{load.idc_oper},{load.loadInfo?.title},
           {load.status},{load.loadInfo?.duration} мин</div>}

        </div>

    )
}