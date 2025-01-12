import Layout from "@/components/Layout/layout";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import PlanScaleContainer from "@/components/PlanScaleContainer/planScaleContainer";

import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { fillGaps } from "@/utils"

import Image from 'next/image';

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { useRouter } from 'next/navigation';
import { formatDate, padNumberToFourDigits } from "@/utils"

import { UOMItem, TCardProductItem, ActionItem, TCardOperationItem, TCardItem, TCardStageItem } from "@/types";

import { } from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface IndexProps {

}

import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";


// Определяем тип для объекта tCard
interface LoadUnit {
  id: number;
  resource: string;
  load: {
    name: string;
    start: number;  // Значение времени в миллисекундах
    finish: number; // Значение времени в миллисекундах
  }[];  // Массив объектов load
}


export default function Planing({ }: IndexProps) {

  const { push } = useRouter();
  const dispatch = useAppDispatch();

  const tCards = useSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })
  const tCardCurrent = useSelector((state: RootState) => {
    return state.dataSlice.tCardCurrent;
  })
  // const tCardCurrentMaxIdc = useSelector((state: RootState) => {
  //   return state.dataSlice.tCardCurrentMaxIdc;
  // })
  // const tCardCurrentProducts = useSelector((state: RootState) => {
  //   return state.dataSlice.tCardCurrentProducts;
  // })
  // const tCardCurrentWastes = useSelector((state: RootState) => {
  //   return state.dataSlice.tCardCurrentWastes;
  // })
  // const tCardCurrentOperations = useSelector((state: RootState) => {
  //   return state.dataSlice.tCardCurrentOperations;
  // })
  // const tCardCurrentMaterials = useSelector((state: RootState) => {
  //   return state.dataSlice.tCardCurrentMaterials;
  // })
  // const tCardCurrentStages = useSelector((state: RootState) => {
  //   return state.dataSlice.tCardCurrentStages;
  // })

  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  const [loaderCard, setLoaderCard] = useState(NaN); // состояние это id категории  

  const selectTCardHandler = async (selectedTCard: TCardItem) => {
    // если новая карта не сохраненная
    // dispatch(setTCardCurrent(selectedTCard))
    // if (selectedTCard.id < 0) {
    //   dispatch(setTCardCurrentMaxIdc(0))
    //   dispatch(setTCardCurrentStages([] as TCardStageItem[]));
    //   dispatch(setTCardCurrentMaterials([] as TCardProductItem[]));
    //   dispatch(setTCardCurrentProducts([] as TCardProductItem[]));
    //   dispatch(settCardCurrentWastes([] as TCardProductItem[]));
    //   dispatch(setTCardCurrentOperations([] as TCardOperationItem[]));
    return;
  }
  const saveCardHandler = async () => {
    setLoaderCard(tCardCurrent.id);
    setLoaderCard(NaN);
  };

  // Карты
  let tCardsReactNodes = tCards.map((elem, index4) => {
    let date = "";
    if (elem.date)
      date = formatDate(elem.date);

    return (
      <div key={index4} className="container_card">
        <div className={`${elem.id === tCardCurrent.id ? "container_card_edit" : ""}`}
          onClick={() => selectTCardHandler(elem)}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id && <>&nbsp; C &nbsp; </>}
          &nbsp; {padNumberToFourDigits(elem.number)} -  {date}
        </div>

      </div>
    );
  })
  // Карты
  let tCards_n_ReactNodes = tCards.map((elem, index) => {
    let date = "";
    if (elem.date)
      date = formatDate(elem.date);

    return (
      <div key={index} className="container_plan">
        <div className={`${elem.id === tCardCurrent.id ? "container_plan_edit" : ""}`}
          onClick={() => selectTCardHandler(elem)}>
          {loaderCard === elem.id && <ButtonLoader />}
          {loaderCard !== elem.id && <>&nbsp; C &nbsp; </>}
          &nbsp; {padNumberToFourDigits(elem.number)} -  {date}
        </div>
        <div className="container_icon_edit_save">
          <Image className="icon_edit_save"
            src={save}
            alt="arrow" width={20} height={20}
            onClick={() => saveCardHandler}
          />
          {elem.modified && <div>*</div>}
        </div>
      </div>
    );
  })
  // ///  ПЛАНИРОВАНИЕ
  // const fullScale = 100 * 24 * 60 * 60 * 1000; // в миллисекундах
  // const hoursInScale = fullScale / (1000 * 60 * 60); // количество часов
  // const dayInScale = fullScale / (1000 * 60 * 60 * 24); // количество дней

  // // создадим почасовую шкалу
  // let timeHScaleReactNodes = Array.from({ length: hoursInScale }, (_, index) => {
  //   return (
  //     <div key={index} className="timeScaleH">
  //       {/* {index + 1} Или любое другое содержимое для отображения */}
  //     </div>
  //   );
  // });
  // // создадим подневную шкалу
  // let timeDScaleReactNodes = Array.from({ length: dayInScale }, (_, index) => {
  //   return (
  //     <div key={index} className="timeScaleD">
  //       {/* {index + 1} Или любое другое содержимое для отображения */}
  //     </div>
  //   );
  // });

  // let newTCardLoad = [{
  //   id: 1,
  //   resource: "unit 1",
  //   load: [
  //     { name: "A1F1", start: 0, finish: 36000000 },
  //     { name: "A1B1C23", start: 36000000, finish: 400000000 },
  //   ]
  // },
  // {
  //   id: 1,
  //   resource: "unit 1",
  //   load: [
  //     { name: "A1B1C2", start: 400000001, finish: 1400000000 },
  //     { name: "A1C27", start: 1400000001, finish: 1500000000 },
  //     { name: "A1F1", start: 1600000001, finish: 1800000000 },
  //   ]
  // },
  // {
  //   id: 1,
  //   resource: "unit 1",
  //   load: [
  //     { name: "A1F1", start: 1500000001, finish: 1600000000 },
  //   ]
  // },] as LoadUnit[]


  // let loading = [
  //   { name: "A1F1", start: 3600000, finish: 108000000 },
  //   { name: "A1B1C23", start: 200000000, finish: 400000000 },
  //   { name: "A1B1C2", start: 1000000000, finish: 1400000000 },
  //   { name: "A1C27", start: 2000000000, finish: 3000000000 },
  // ] as { name: string, start: number, finish: number }[]



  // let timeLScale = fillGaps(0, loading);
  // let timeLScale = [] as { loaded: boolean, name: string, start: number, finish: number }[]
  // // заполним пропуски
  // let dataStart = 0;
  // for (let index = 0; index < loading.length; index++) {
  //   const element = loading[index];
  //   if (dataStart < element.start) {
  //     timeLScale.push({ loaded: false, name: "", start: dataStart, finish: element.start - 1 })
  //     dataStart = element.start;
  //     timeLScale.push({ loaded: true, name: element.name, start: dataStart, finish: element.finish })
  //     dataStart = element.finish + 1;
  //   } else if (dataStart = element.start) {
  //     timeLScale.push({ loaded: true, name: "", start: dataStart, finish: element.finish })
  //     dataStart = element.finish + 1;
  //   } else if (dataStart > element.start) {
  //     // Колизия
  //     timeLScale.push({ loaded: true, name: "Конфликт:" + element.name, start: dataStart, finish: element.finish })
  //     dataStart = element.finish + 1;
  //   }

  // }
  // создадим шкалу загрузки

  // let timeLScaleReactNodes = timeLScale.map((elem, index) => {
  //   let minWidth = (elem.finish - elem.start) / (1000 * 60 * 60)
  //   return (
  //     <div key={index} className={elem.loaded ? "timeScaleL" : "timeScaleE"} style={{ minWidth: minWidth }}>
  //     </div>
  //   );
  // })


  // let timeLScaleUnit1 = fillGaps(0, newTCardLoad[0].load);
  // создадим шкалу unit1
  // let timeLScaleUnit1ReactNodes = timeLScaleUnit1.map((elem, index) => {
  //   let minWidth = (elem.finish - elem.start) / (1000 * 60 * 60)
  //   return (
  //     <div key={index} className="timeScaleL" style={{ minWidth: minWidth }}>
  //     </div>
  //   );
  // })
  // let timeLScaleUnit2 = fillGaps(200000, newTCardLoad[1].load);
  // // создадим шкалу unit2
  // let timeLScaleUnit2ReactNodes = timeLScaleUnit2.map((elem, index) => {
  //   let minWidth = (elem.finish - elem.start) / (1000 * 60 * 60)
  //   return (
  //     <div key={index} className="timeScaleL" style={{ minWidth: minWidth }}>
  //     </div>
  //   );
  // })

  // // создадим шкалу unit2
  // let timeLScaleUnit3ReactNodes = newTCardLoad[2].load.map((elem, index) => {
  //   let minWidth = (elem.finish - elem.start) / (1000 * 60 * 60)
  //   return (
  //     <div key={index} className="timeScaleL" style={{ minWidth: minWidth }}>
  //     </div>
  //   );
  // })

  return (
    <Layout>
      <div className="container" >
        <div className="container_left">
          {/* <div className="container_left_inner"> */}
          <div className="container_planing_title">запланированы</div>
          <div className="container_planing">
            {tCardsReactNodes}
          </div>
          <div className="container_planing_title_n"> не запланированы</div>
          <div className="container_planing_n">
            {tCards_n_ReactNodes}
          </div>
          <div className="container_planing_title">Пояснение</div>
          <div className="container_message">{message} dgdgdg
            {/* </div> */}
          </div>

        </div>
        <div className="container_right pl_container_right">
          <PlanScaleContainer />


          {/* <div className="pl_container_tk">
            <div className="pl_container_title"> моделируемая карта </div>

            <div className="pl_container_unit_scale">
              <div className="pl_scale_name">Unit 1 </div>
              
              <div className="pl_container_scale">
                <div className="pl_container_scale1">
              
                  {timeLScaleUnit1ReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeDScaleReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeHScaleReactNodes}
                </div>
              </div>

            </div>
            <div className="pl_container_unit_scale">
              <div className="pl_scale_name">Unit 2 </div>
             
              <div className="pl_container_scale">
                <div className="pl_container_scale1">
             
                  {timeLScaleUnit2ReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeDScaleReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeHScaleReactNodes}
                </div>
              </div>

            </div>
            <div className="pl_container_unit_scale">
              <div className="pl_scale_name">Unit 3 </div>
              
              <div className="pl_container_scale">
                <div className="pl_container_scale1">
              
                  {timeLScaleUnit3ReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeDScaleReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeHScaleReactNodes}
                </div>
              </div>

            </div>
            <div className="pl_container_unit_scale">
              <div className="pl_scale_name">Partner 1 </div>
            
              <div className="pl_container_scale">
                <div className="pl_container_scale1">            
                </div>
                <div className="pl_container_scale1">
                  {timeDScaleReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeHScaleReactNodes}
                </div>
              </div>

            </div>
            <div className="pl_container_unit_scale">
              <div className="pl_scale_name">Partner 2 </div>
              
              <div className="pl_container_scale">
                <div className="pl_container_scale1">              
                </div>
                <div className="pl_container_scale1">
                  {timeDScaleReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeHScaleReactNodes}
                </div>
              </div>

            </div>




          </div> */}
        </div>


      </div>
    </Layout>
  )
}