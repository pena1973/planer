import Layout from "@/components/Layout/layout";
import Arrow1 from "@/components/Arrow1/arrow1";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';


import Image from 'next/image';
import { useAppDispatch } from "@/pages/_app";
import { useRouter } from 'next/navigation';



import {

} from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface ResourcesProps {

}

export default function Resources({ }: ResourcesProps) {

  const { push } = useRouter();
  const dispatch = useAppDispatch();

  let resources = [
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

  let resourcesReactNodes = resources.map((elem, index) => {
    return (
      <div key={index} className="resources_container_unit">Ресурс {elem.id}</div>
    );
  })

  const [startX, setStartX] = useState(50);
  const [startY, setStartY] = useState(50);
  const [endX, setEndX] = useState(200);
  const [endY, setEndY] = useState(200);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setEndX(prev => prev + 1); // Пример плавного движения
  //     setEndY(prev => prev + 10); // Пример плавного движения
  //   }, 100);

  //   return () => clearInterval(interval); // Очистка интервала
  // }, []);

  return (
    <Layout>
      <div className="resources_container" >
        <div className="resources_container_left">
          <div className="resources_container_units">
            <div className="resources_container_units">
              {resourcesReactNodes}
            </div>
            <button>Добавить</button>
          </div>
        </div>
        {/* <ReactArrowExample/> */}
        <Arrow1 startX={300} startY={300} endX={400} endY={450} strokeWidth={1} strokeStyle='solid' />
        <div style={{ position: 'relative', width: '500px', height: '500px', border: '1px solid black' }}>
          <Arrow1 startX={startX} startY={startY} endX={endX} endY={endY} strokeWidth={1} strokeStyle="dashed" />
        </div>
        {/* <div className="resources_container_right">
        <div className="souces_container_right_unit">
          <div className="souces_container_right_unit_title">Операции</div>
          <div className="souces_container_right_operation">Сборка 1</div>
          <div className="souces_container_right_operation">Сборка 2</div>
          <div className="souces_container_right_operation">Сборка 3</div>
          <div className="souces_container_right_operation">Сборка 4</div>
          <div className="souces_container_right_operation_new">
            <input className="souces_container_right_operation_new_name" />
            <button > сохранить</button>
          </div>

        </div>
        <div className="souces_container_right_unit">
          <div className="souces_container_right_unit_title">Материалы</div>
          <div className="souces_container_right_operation">сверло </div>
          <div className="souces_container_right_operation">наконечник</div>
          <div className="souces_container_right_operation_new">
            <input className="souces_container_right_operation_new_name" />
            <button > сохранить</button>
          </div>
        </div>
        <div className="souces_container_right_unit">
          <div className="souces_container_right_unit_title">Прочая информация</div>
          <div className="souces_container_right_operation">Резка 10</div>
          <div className="souces_container_right_operation_new">
            <input className="souces_container_right_operation_new_name" />
            <button > сохранить</button>
          </div>
        </div>
      </div> */}


      </div>
    </Layout >
  )
}