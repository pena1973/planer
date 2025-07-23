import React from 'react';
import styles from "./planedCardRow.module.scss";
import Image from 'next/image';
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { StatusCircle } from "@/components/StatusCircle/statusCircle";
import { TCardItem } from "@/types/types";
import save from "@/public/save-rem.png";
import eraz from "@/public/erazer1-rem.png";
import light from "@/public/light-rem.png";
import lighton from "@/public/light-on-rem.png";

import { padNumberToFourDigits } from "@/lib/utils";

interface ToPlanCardRowProps {
  elem: TCardItem;
  tCardPrepared: TCardItem;
  droploaderCard: number | null;
  saveLoaderCard: number | null;
  erazLoaderCard: number | null;
  tCardLighted: TCardItem;
  isDragging: boolean;
  formatDate: (date: Date) => string;
  lightTCardHandler: (elem: TCardItem, lightOn: boolean) => void;
  saveCardHandler: () => void;
  erazCardHandler: (id: number) => void;
  handleMouseDownTCard: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleDragStartTCard: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
}

const ToPlanCardRow: React.FC<ToPlanCardRowProps> = ({
  elem,
  tCardPrepared,
  droploaderCard,
  saveLoaderCard,
  erazLoaderCard,
  tCardLighted,
  isDragging,
  formatDate,
  lightTCardHandler,
  saveCardHandler,
  erazCardHandler,
  handleMouseDownTCard,
  handleDragStartTCard
}) => {
  const date = elem.date ? formatDate(new Date(elem.date)) : "";

  return (
    <div className="container_plan_card_prepared">

      <div className={`container_plan_card_icon_light ${elem.id === tCardPrepared?.id ? "container_plan_edit" : ""}`}>
        {droploaderCard === elem.id && <ButtonLoader />}
        {droploaderCard !== elem.id &&
          (elem.id === tCardLighted.id ?
            <Image className="icon_edit_save" src={lighton} alt="lighton"
              width={20} height={20} onClick={() => lightTCardHandler(elem, false)} />
            : <Image className="icon_edit_save" src={light} alt="light"
              width={20} height={20} onClick={() => lightTCardHandler(elem, true)} />)
        }
        {/* &nbsp; */}
        {/* &nbsp; */}
        <StatusCircle status={elem.status} />
        {/* &nbsp; */}
       
        <div className="container_plan_card_prepared_title draggable-item"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDownTCard} // Добавляем обработчик нажатия мыши при перетаскивании        
          draggable
          onDragStart={(e) => handleDragStartTCard(e, elem.id)}
        >{padNumberToFourDigits(elem.idc)} - {date}</div>
      </div>

      <div className="container_icon_edit_save">

        {tCardPrepared?.id === elem.id && saveLoaderCard === elem.id && <ButtonLoader />}
        {tCardPrepared?.id === elem.id && saveLoaderCard !== elem.id &&
          <Image className="icon_edit_save"
            src={save}
            alt="arrow" width={20} height={20}
            onClick={() => saveCardHandler()}
          />}

        {erazLoaderCard === elem.id && <ButtonLoader />}
        {erazLoaderCard !== elem.id &&
          <Image className="icon_edit_save"
            src={eraz}
            alt="eraz" width={20} height={20}
            onClick={() => erazCardHandler(elem.id)}
          />}
      </div>
    </div>
  );
};

export default ToPlanCardRow;