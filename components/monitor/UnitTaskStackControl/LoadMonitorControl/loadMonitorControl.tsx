
import styles from "./loadMonitorControl.module.scss";
import { StatusEnum, UnitLoadItem } from "@/types/types";
import { useTranslation } from 'react-i18next';
export interface LoadMonitorControlProps {
    loadHeight: number,
    showTitle: boolean,
    load: UnitLoadItem,  // здесь должны прийти выполненные операции
    titleCard: string,
    openOperHandler: (load:UnitLoadItem,id_oper: number, id_tCard: number) => void,
    index: number,
}

export default function LoadMonitorControl({
    loadHeight,
    showTitle,
    load,
    titleCard,
    openOperHandler,
    index,
}: LoadMonitorControlProps) {
 const { t, i18n } = useTranslation();
    let intervalClass = `${styles.interval}`; // Класс по умолчанию
    let titleClass = `${styles.title_load}`; // Класс по умолчанию
    switch (load.status) {
        case StatusEnum.cancelled:
            intervalClass = `${styles.interval} ${styles.cancelled}`; // Если статус "draft"
            titleClass = `${styles.title_load} ${styles.cancelled}`;
            break;        
        case StatusEnum.performed:
            intervalClass = `${styles.interval} ${styles.performed}`; // Если статус "draft"
            titleClass = `${styles.title_load} ${styles.performed}`;
            break;
        case StatusEnum.ready:
            intervalClass = `${styles.interval} ${styles.ready}`; // Если статус "draft"
            titleClass = `${styles.title_load} ${styles.ready}`;
            break;
        case StatusEnum.planed:
            intervalClass = `${styles.interval} ${styles.planed}`; // Если статус "planed"
            titleClass = `${styles.title_load} ${styles.planed}`;
            break;
        case StatusEnum.prepared:
            intervalClass = `${styles.interval} ${styles.prepared}`; // Если статус "prepared"
            titleClass = `${styles.title_load} ${styles.prepared}`;
            break;
        case StatusEnum.defective:
            intervalClass = `${styles.interval} ${styles.defective}`; // Бракованный
            titleClass = `${styles.title_load} ${styles.defective}`;
            break;
        default:
            intervalClass = `${styles.interval} ${styles.draft}`; // Класс по умолчанию для остальных статусов
            titleClass = `${styles.title_load} ${styles.draft}`;
            break;
    }
    intervalClass = load.isRetool ? `${intervalClass} ${styles.retool}` : intervalClass;
    intervalClass = showTitle ? `${intervalClass} ${styles.first}` : `${intervalClass} ${styles.second}`;


    return (

        <div className={intervalClass}
            id={String(load.idc)}
            style={{ height: `${loadHeight}px` }}
            onClick={(event) => {
                openOperHandler(load,load.id_oper, load.id_tCard); // обработчик клика по операции
            }}
            onContextMenu={(event) => {
                event.preventDefault(); // предотвращаем стандартное контекстное меню                    
            }}
        >
            {showTitle && <div className={titleClass}>
                <div >{t('loadMonitorProcess.card')}: {titleCard}</div>
                <div > Oper: A{load.idc_oper},{load.loadInfo?.title},
                    {load.status},{load.loadInfo?.duration} {t('loadMonitorProcess.min')}</div>
            </div>}
        </div>

    )
}