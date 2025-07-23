
import styles from "./contextMenuInner.module.scss";
import { useState } from "react";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { padNumberToFourDigits, } from "@/lib/utils"
import Image from 'next/image';
import eraz from "@/public/erazer1-rem.png";
import { UnitLoadItem } from "@/types/types";
import { useTranslation } from 'react-i18next';

export interface ContexMenuInnerProps {
    load: UnitLoadItem,
    left: number,
    width: number,
    erazLoadHandler: (load_idc: number) => void;
    retool: number,
    blocked: boolean
}

export default function ContexMenuInner({    
    load,
    left,
    width,
    erazLoadHandler,
    retool,
    blocked,


}: ContexMenuInnerProps) {
    const { t, i18n } = useTranslation();

    const [buttonLoader, setButtonLoader] = useState(false);

    function convertMinutes(totalMinutes: number): { hours: number; minutes: number } {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return { hours, minutes };
    }

    const dur = Math.round(Number(load.isRetool ? retool : load.loadInfo?.duration));

    const time = convertMinutes(dur);

    return (
        <div className={styles.container_context_menu}
            style={{ left: `${left + width - width / 2 - 10}px` }} >
            {/* Треугольник (стрелка) */}
            {/* <div className={styles.contextMenuTriangle} /> */}

            <div className={styles.coment}>
                <span className={styles.title}> {t('contexMenuI.card')}</span> {`: ${padNumberToFourDigits(load.loadInfo.tCardIdc)} - ${new Date(load.loadInfo.tCardDate).toLocaleDateString("en-CA")}`}
            </div>

            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuI.action')}</span> {`: A${load.idc_oper} (${load.isRetool ? "retool" : load.loadInfo?.title})`}
            </div>
            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuI.duration')}</span> {`: ${dur} min (${time.hours} h, ${time.minutes} m)`}
            </div>

            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuI.interruptible')}</span> {`: ${load.loadInfo?.interruptible ? "yes" : "no"}`}
            </div>

            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuI.koef')}</span> {`: ${load.loadInfo?.koef}`}
            </div>

            <div className={styles.coment}>
                <span className={styles.title}>{t('contexMenuI.status')}</span> {`: ${load.status}`}
            </div>


            {/* <button> отменить</button> */}
            {!blocked && <div className={styles.container_icon}>
                {buttonLoader && <ButtonLoader />}
                {!buttonLoader &&
                    <Image className={styles.icon_edit_save}
                        src={eraz}
                        alt="eraz" width={20} height={20}
                        onClick={async () => {
                            setButtonLoader(true); // Показываем индикатор загрузки
                            erazLoadHandler(load.idc); // Вызываем асинхронную функцию
                            setButtonLoader(false); // Скрываем индикатор загрузки
                        }}
                    />}
            </div>}
        </div>
    )
}