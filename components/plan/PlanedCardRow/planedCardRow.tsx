import React from 'react';
import styles from "./planedCardRow.module.scss";
import Image from 'next/image';
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { StatusCircle } from "@/components/StatusCircle/statusCircle";
import { TCardItem } from "@/types/types";
import eraz from "@/public/erazer1-rem.png";
import light from "@/public/light-rem.png";
import lighton from "@/public/light-on-rem.png";
import { padNumberToFourDigits } from "@/lib/client/utils.client";

interface PlanedCardRowProps {
    elem: TCardItem; // Лучше задать точный тип вместо `any`
    droploaderCard: number | null;
    erazLoaderCard: number | null;
    tCardLighted: TCardItem;
    lightTCardHandler: (elem: TCardItem, lightOn: boolean) => void;
    erazCardHandler: (id: number) => void;
    // formatDate: (date: Date) => string;
}

const PlanedCardRow: React.FC<PlanedCardRowProps> = ({
    elem,
    droploaderCard,
    erazLoaderCard,
    tCardLighted,
    lightTCardHandler,
    erazCardHandler,
    // formatDate
}) => {

    // const date = elem.date ? formatDate(new Date(elem.date)) : "";
     const date = elem.date ? elem.date:"";
    return (
        <div className="container_plan_card_planed">
            <div className="container_plan_card_icon_light">
                {droploaderCard === elem.id && <ButtonLoader />}
                {droploaderCard !== elem.id &&
                    (elem.id === tCardLighted.id ?
                        <Image className="icon_edit_save" src={lighton} alt="lighton"
                            width={20} height={20} onClick={() => lightTCardHandler(elem, false)} />
                        : <Image className="icon_edit_save" src={light} alt="light"
                            width={20} height={20} onClick={() => lightTCardHandler(elem, true)} />)
                }
                &nbsp;
                &nbsp;
                <StatusCircle status={elem.status} />
                &nbsp;
                &nbsp;
                <div className="container_plan_card_planed_title">{padNumberToFourDigits(elem.idc)} -  {date}</div>
            </div>

            <div className="container_icon_edit_save">
                {erazLoaderCard === elem.id && <ButtonLoader />}
                {erazLoaderCard !== elem.id &&
                    <Image className="icon_edit_save"
                        src={eraz}
                        alt="eraz" width={20} height={20}
                        onClick={() => erazCardHandler(elem.id)}
                    />}
                {tCardLighted?.id === elem.id}
            </div>
        </div>
    );
};

export default PlanedCardRow;
