import Layout from "@/components/Layout/layout";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import {fillGaps} from "@/utils"

import Image from 'next/image';
import { useAppDispatch } from "@/pages/_app";
import { useRouter } from 'next/navigation';



import {

} from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface IndexProps {

}



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
  // распределенные
  let tCards = [
    { id: 100 },
    { id: 123 },
    { id: 513 },
    { id: 145 },
    { id: 100 },
    { id: 123 },
    { id: 513 },
    { id: 145 },
    { id: 100 },
    { id: 123 },
    { id: 513 },
    { id: 145 },
    { id: 100 },
    { id: 123 },
    { id: 513 },
    { id: 145 },
    { id: 100 },
    { id: 123 },
    { id: 513 },
    { id: 145 },
    { id: 100 },
    { id: 123 },
    { id: 513 },
    { id: 145 },
  ] as { id: number }[]
  // нужна проверка количества и последователшьности стадий

  let tCardsReactNodes = tCards.map((elem, index) => {
    return (
      <div key={index} className="container_card">Тех карта {elem.id}</div>
    );
  })
  // распределенные
  let tCardsN = [
    { id: 100 },
    { id: 123 },
    { id: 513 },
    { id: 145 },
  ] as { id: number }[]
  // нужна проверка количества и последователшьности стадий

  let tCardsNReactNodes = tCardsN.map((elem, index) => {
    return (
      <div key={index} className="container_card">Тех карта {elem.id}</div>
    );
  })

  const fullScale = 100 * 24 * 60 * 60 * 1000; // в миллисекундах
  const hoursInScale = fullScale / (1000 * 60 * 60); // количество часов
  const dayInScale = fullScale / (1000 * 60 * 60 * 24); // количество дней

  // создадим почасовую шкалу
  let timeHScaleReactNodes = Array.from({ length: hoursInScale }, (_, index) => {
    return (
      <div key={index} className="timeScaleH">
        {/* {index + 1} Или любое другое содержимое для отображения */}
      </div>
    );
  });
  // создадим подневную шкалу
  let timeDScaleReactNodes = Array.from({ length: dayInScale }, (_, index) => {
    return (
      <div key={index} className="timeScaleD">
        {/* {index + 1} Или любое другое содержимое для отображения */}
      </div>
    );
  });

  let newTCardLoad = [{
    id:1,
    resource:"unit 1",
    load:[
    { name: "A1F1", start: 0, finish: 36000000 },
    { name: "A1B1C23", start: 36000000, finish: 400000000 },
  ]},
  {
    id:1,
    resource:"unit 1",
    load:[
      { name: "A1B1C2", start: 400000001, finish: 1400000000 },
      { name: "A1C27", start: 1400000001, finish: 1500000000 },
      { name: "A1F1", start: 1600000001, finish: 1800000000 },    
  ]},
  {
    id:1,
    resource:"unit 1",
    load:[
    { name: "A1F1", start: 1500000001, finish: 1600000000 },    
  ]},] as LoadUnit[]

  

  let loading = [
    { name: "A1F1", start: 3600000, finish: 108000000 },
    { name: "A1B1C23", start: 200000000, finish: 400000000 },
    { name: "A1B1C2", start: 1000000000, finish: 1400000000 },
    { name: "A1C27", start: 2000000000, finish: 3000000000 },
  ] as { name: string, start: number, finish: number }[]



  let timeLScale =  fillGaps(0,loading);
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
  let timeLScaleReactNodes = timeLScale.map((elem, index) => {
    let minWidth = (elem.finish - elem.start) / (1000 * 60 * 60)
    return (
      <div key={index} className={elem.loaded ? "timeScaleL" : "timeScaleE"} style={{ minWidth: minWidth }}>
      </div>
    );
  })


let timeLScaleUnit1 =  fillGaps(0,newTCardLoad[0].load);
// создадим шкалу unit1
let timeLScaleUnit1ReactNodes = timeLScaleUnit1.map((elem, index) => {
  let minWidth = (elem.finish - elem.start) / (1000 * 60 * 60)
  return (
    <div key={index} className="timeScaleL" style={{ minWidth: minWidth }}>
    </div>
  );
})
let timeLScaleUnit2 =  fillGaps(200000,newTCardLoad[1].load);
// создадим шкалу unit2
let timeLScaleUnit2ReactNodes = timeLScaleUnit2.map((elem, index) => {
  let minWidth = (elem.finish - elem.start) / (1000 * 60 * 60)
  return (
    <div key={index} className="timeScaleL" style={{ minWidth: minWidth }}>
    </div>
  );
})

// создадим шкалу unit2
let timeLScaleUnit3ReactNodes = newTCardLoad[2].load.map((elem, index) => {
  let minWidth = (elem.finish - elem.start) / (1000 * 60 * 60)
  return (
    <div key={index} className="timeScaleL" style={{ minWidth: minWidth }}>
    </div>
  );
})

  return (
    <Layout>
      <div className="container" >
        <div className="container_left">
          <div className="pl_container_left_inner">
            <div className="pl_container_cards_title">запланированы</div>
            <div className="pl_container_cards">
              {tCardsReactNodes}
            </div>
            <div className="pl_container_cards_title">не запланированы</div>
            <div className="pl_container_cards_n">
              {tCardsNReactNodes}
            </div>
            <div className="pl_container_cards_title"></div>
          </div>

        </div>
        <div className="container_right pl_container_right">
          <div className="pl_container_title"> Свои </div>
          {/* <div className="pl_container_resources"> */}
          <div className="pl_container_unit_scale">
            <div className="pl_scale_name">Unit 1 </div>
            {/* // временная разметка */}
            <div className="pl_container_scale">
              <div className="pl_container_scale1">
                {/* // загрузка */}
                {timeLScaleReactNodes}
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
            {/* // временная разметка */}
            <div className="pl_container_scale">
              <div className="pl_container_scale1">
                {/* // загрузка */}
                {timeLScaleReactNodes}
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
            {/* // временная разметка */}
            <div className="pl_container_scale">
              <div className="pl_container_scale1">
                {/* // загрузка */}
                {timeLScaleReactNodes}
              </div>
              <div className="pl_container_scale1">
                {timeDScaleReactNodes}
              </div>
              <div className="pl_container_scale1">
                {timeHScaleReactNodes}
              </div>
            </div>

          </div>

          {/* </div> */}
          <div className="pl_container_title"> Сторонние </div>
          {/* <div className="pl_container_partners"> */}
          <div className="pl_container_unit_scale">
            <div className="pl_scale_name">Partner 1 </div>
            {/* // временная разметка */}
            <div className="pl_container_scale">
              <div className="pl_container_scale1">
                {/* // загрузка */}
                {timeLScaleReactNodes}
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
            {/* // временная разметка */}
            <div className="pl_container_scale">
              <div className="pl_container_scale1">
                {/* // загрузка */}
                {timeLScaleReactNodes}
              </div>
              <div className="pl_container_scale1">
                {timeDScaleReactNodes}
              </div>
              <div className="pl_container_scale1">
                {timeHScaleReactNodes}
              </div>
            </div>

          </div>


          {/* </div> */}
          <div className="pl_container_tk">
            <div className="pl_container_title"> моделируемая карта </div>

            <div className="pl_container_unit_scale">
              <div className="pl_scale_name">Unit 1 </div>
              {/* // временная разметка */}
              <div className="pl_container_scale">
                <div className="pl_container_scale1">
                  {/* // загрузка */}
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
              {/* // временная разметка */}
              <div className="pl_container_scale">
                <div className="pl_container_scale1">
                  {/* // загрузка */}
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
              <div className="pl_scale_name">Unit 2 </div>
              {/* // временная разметка */}
              <div className="pl_container_scale">
                <div className="pl_container_scale1">
                  {/* // загрузка */}
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
              {/* // временная разметка */}
              <div className="pl_container_scale">
                <div className="pl_container_scale1">
                  {/* // загрузка */}
                  {/* {timeLScaleReactNodes} */}
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
              {/* // временная разметка */}
              <div className="pl_container_scale">
                <div className="pl_container_scale1">
                  {/* // загрузка */}
                  {/* {timeLScaleReactNodes} */}
                </div>
                <div className="pl_container_scale1">
                  {timeDScaleReactNodes}
                </div>
                <div className="pl_container_scale1">
                  {timeHScaleReactNodes}
                </div>
              </div>

            </div>




          </div>
        </div>


      </div>
    </Layout>
  )
}