import React from 'react';
 import styles from "./defectiveCardRow.module.scss";
import Image from 'next/image';
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { StatusCircle } from "@/components/StatusCircle/statusCircle";
import { TCardItem } from "@/types/types";
import eraz from "@/public/erazer1-rem.png";
import light from "@/public/light-rem.png";
import lighton from "@/public/light-on-rem.png";

import { padNumberToFourDigits } from "@/lib/client/utils.client";

interface DefectiveCardRowProps {
  tCard: TCardItem;
  lightloaderCard: number | null;  
  tCardLighted: TCardItem;
  // formatDate: (date: Date) => string;
  lightTCardHandler: (elem: TCardItem, lightOn: boolean) => void;  
}

const DefectiveCardRow: React.FC<DefectiveCardRowProps> = ({
  tCard,
  lightloaderCard,  
  tCardLighted,  
  lightTCardHandler,  
}) => {

  // const date = tCard.date ? formatDate(new Date(tCard.date)) : "";

  return (
    <div className="container_plan_card_planed">
      <div className="container_plan_card_icon_light">
        {lightloaderCard === tCard.id && <ButtonLoader />}
        {lightloaderCard !== tCard.id &&
          (tCard.id === tCardLighted.id ?
            <Image className="icon_edit_save" src={lighton} alt="lighton"
              width={20} height={20} onClick={() => lightTCardHandler(tCard, false)} />
            : <Image className="icon_edit_save" src={light} alt="light"
              width={20} height={20} onClick={() => lightTCardHandler(tCard, true)} />)
        }
        &nbsp;
        &nbsp;
        <StatusCircle status={tCard.status} />
        &nbsp;
        &nbsp;
        <div className="container_plan_card_planed_title">{padNumberToFourDigits(tCard.idc)} -  {tCard.date}</div>
      </div>
      
    </div>
  );
};

export default DefectiveCardRow;