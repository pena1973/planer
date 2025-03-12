
import styles from "./contextMenu.module.scss";

import { formatDate, padNumberToFourDigits, ISOStringToLocalDateTime } from "@/utils"

import Image from 'next/image';

import { useEffect, useState, useRef } from "react";

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setUOMs, } from '@/store/slices'

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import eraz from "@/public/erazer1-rem.png";

import { TCardItem, UnitLoadItem, TCardOperationItem } from "@/types";

export interface ContexMenuProps {
    tCard: TCardItem,
    load: UnitLoadItem,
    left: number,
    width: number,
    erazLoadHandler: (idc: number) => void,
    // koef: number,
    retool: number,
    // setMessage: (message: string) => void
}

export default function ContexMenu({
    tCard,
    load,
    left,
    width,
    erazLoadHandler,
    retool,
    // setMessage 
}: ContexMenuProps) {
    // const dispatch = useAppDispatch();

     const [modified, setModified] = useState(false); // при установке состояния происходит смена формы

    // useEffect(() => {

    // }, []);
    function convertMinutes(totalMinutes: number): { hours: number; minutes: number } {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return { hours, minutes };
      }
    let dur = load.isRetool ? retool :load.loadInfo?.duration;
    const time = convertMinutes(Number(dur));

    return (
        <div className={styles.container_context_menu}
            style={{ left: `${left + width - width/2-10}px` }} >
            {/* Треугольник (стрелка) */}
            <div className={styles.contextMenuTriangle} />

            <div className={styles.coment}>
                <span className={styles.title}>card</span> {`: C ${padNumberToFourDigits(tCard.number)} - ${new Date(tCard.date).toLocaleDateString("en-CA")}`}
            </div>

            <div className={styles.coment}>
                <span className={styles.title}>operation</span> {`: C${load.idc_oper} (${load.isRetool ? "retool" : load.loadInfo?.title})`} 
            </div>
            <div className={styles.coment}>
                <span className={styles.title}>duration</span> {`: ${load.isRetool ? retool :load.loadInfo?.duration} min (${time.hours} h, ${time.minutes} m)` }            
            </div>
            
            <div className={styles.coment}>
                <span className={styles.title}>interruptible</span> {`: ${load.loadInfo?.interruptible ? "yes" : "no"}`}            
            </div>
            
            <div className={styles.coment}>
                <span className={styles.title}>unit koef</span> {`: ${load.loadInfo?.koef}`}            
            </div>
            
            <div className={styles.coment}>
                <span className={styles.title}>status</span> {`: ${load.status}`}            
            </div>

            
            {/* <button> отменить</button> */}
            <div className={styles.container_icon}>
                <Image className={styles.icon_edit_save}
                    src={eraz}
                    alt="eraz" width={20} height={20}
                    onClick={() => erazLoadHandler(load.idc)}
                />
            </div>
        </div>
    )
}