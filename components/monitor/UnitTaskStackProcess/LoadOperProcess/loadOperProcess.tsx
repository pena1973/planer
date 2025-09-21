
import styles from "./loadOperProcess.module.scss";
import Image from 'next/image';
import { StatusEnum, TCardOperationItem, TCardItem } from "@/types/types";
import { padNumberToFourDigits, } from "@/lib/client/utils.client"

import cancel from "@/public/cancel.png";

import { useTranslation } from 'react-i18next';

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
    setOperStatusHandler: (status: StatusEnum, operId: number, tCardId: number) => void,
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
    const { t, i18n } = useTranslation();
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
                <div key={elem.id} className={styles.inn_line}>
                    <div className={styles.oper_title}>{elem.product.title} {elem.qtu} {elem.product.uom.title}</div>
                    <div className={styles.oper_title}> code:  {elem.code} </div>
                </div>
            )
        })
    }
    let outReactNodes = [] as JSX.Element[];
    if (oper.out) {
        outReactNodes = oper.out.map((elem) => {
            return (
                <div key={elem.id} className={styles.inn_line}>
                    <div className={styles.oper_title}>{elem.product.title} {elem.qtu} {elem.product.uom.title}</div>
                    <div className={styles.oper_title}> code:  {elem.code} </div>
                </div>
            )
        })
    }
    // const titleCard = `${padNumberToFourDigits(tCard.idc)} - ${new Date(tCard.date).toLocaleDateString("en-CA")};`
    const titleCard = `${padNumberToFourDigits(tCard.idc)} - ${tCard.date};`

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
                <div className={styles.oper_title}>{t('loadOperProcess.card')}: {titleCard}</div>
                <div className={styles.oper_title}>{t('loadOperProcess.oper')}: A{oper.idc}, {operInfo?.title}, {oper.status}, {operInfo?.duration} {t('loadOperProcess.min')}</div>
                <div className={styles.oper_title}>{t('loadOperProcess.start')}: {operInfo?.start.date}: {formatMinutes(operInfo?.start.time)}</div>
                <div className={styles.oper_title}>{t('loadOperProcess.finish')}: {operInfo?.finish.date}: {formatMinutes(operInfo?.finish.time)}</div>
            </div>

            <div className={styles.oper_content}>
                {/* результат */}
                <div className={styles.oper_content_container}>
                    <div className={styles.oper_title}><span className={styles.bold_text}>{t('loadOperProcess.result')}</span></div>
                    {outReactNodes}
                </div>
                {/* источник */}
                <div className={styles.oper_content_container}>
                    <div className={styles.oper_title}><span className={styles.bold_text}>{t('loadOperProcess.source')}</span></div>
                    {innReactNodes}
                </div>
                {/* задача */}
                <div className={styles.oper_content_container}>
                    <div className={styles.oper_title}><span className={styles.bold_text}>{t('loadOperProcess.task')}</span></div>
                    <div className={styles.oper_coment}>{(oper.coment) ? oper.coment : t('loadOperProcess.noComents')}</div>
                </div>

            </div>

            <div className={styles.button_container}>
                {isQualControl && oper.status === StatusEnum.planed && <button className={styles.button_perfotmed_top} onClick={() => setOperStatusHandler(StatusEnum.performed, Number(oper.id), tCard.id)}>{t('loadOperProcess.perfotmed')}</button>}
                {!isQualControl && oper.status === StatusEnum.planed && <button className={styles.button_ready_top} onClick={() => setOperStatusHandler(StatusEnum.ready, Number(oper.id), tCard.id)}>{t('loadOperProcess.ready')}</button>}
                {!isQualControl && oper.status === StatusEnum.planed && <button className={styles.button_defected_top} onClick={() => setOperStatusHandler(StatusEnum.defective, Number(oper.id), tCard.id)}>{t('loadOperProcess.defective')}</button>}
            </div>
        </div>

    )
}