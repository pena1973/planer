import Layout from "@/components/Layout/layout";
import FileUploadButton from "@/components/FileUploadButton/fileUploadButton";
import UOMSCatalog from "@/components/catalogs/UOMSCatalog/uomsCatalog";
import ActionsCatalog from "@/components/catalogs/ActionsCatalog/аctionsCatalog";
import CompanySchedule from "@/components/catalogs/CompanySchedule/сompanySchedule";

import UnitsCatalog from "@/components/catalogs/UnitsCatalog/unitsCatalog";
// import Arrow1 from "@/components/Arrow1/arrow1";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { ActionItem, UOMItem, UnitItem } from '@/types'

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";


import {

} from '@/store/slices';
import { Index } from "typeorm";

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface ResourcesProps {

}

export default function Resources({ }: ResourcesProps) {

  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  const [resource, setResource] = useState(1); // переключатель между каталогами

  // загружает настройки
  const selectSetting = async () => {
    setResource(1);

  };
  // загружает действия которые делают юниты
  // Разные юниты могут делать одно и тоже действие  
  const selectActions = async () => {
    setResource(2);
  }

  // загружает единицы измерения
  const selectUOMs = async () => {
    setResource(3);
    try {
      const res = await fetch(`/api/tcards-api?userId=${1}&companyId=${1}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)        
        if (receivedData.success) {
          // //   Обновим текущую карту
          // let tCards = receivedData.tCards as TCardItem[]
          // // Сортируем tCards по номеру (если number это число)
          // let tCards_ = tCards.sort((a, b) => a.number - b.number);
          // let tCardsUpdated = tCards_.map(card => { return { ...card, date: new Date(card.date) } });
          // dispatch(setTCards(tCardsUpdated));
          // setMessage("Карты успешно получены");
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
  };
  // загружает рабочие центры Юниты
  const selectSUnits = async () => {
    setResource(4);
  }

  // Начальный загруз
  useEffect(() => {

  }, []);


  const onFocusUnitHandler = (code: string) => {

    console.log('Code:', code);
    // Дальнейшая обработка данных
  };
  // Загрузка файла
  const onFileUpload = (content: UOMItem | ActionItem | UnitItem) => {
    console.log('File uploaded with content:', content);
    // Дальнейшая обработка данных
  };



  return (
    <Layout>
      <div className="container" >
        <div className="container_left">
          <div className="container_left_inner">

            <div className="container_catalogs">
              <div className="resources_container_catalog" onClick={selectSetting}>Настройки</div>
              <div className="resources_container_catalog" onClick={selectActions}>Действия</div>
              <div className="resources_container_catalog" onClick={selectUOMs}>Единицы измерения</div>
              <div className="resources_container_catalog" onClick={selectSUnits}>Юниты</div>

            </div>
            <div className="container_cards_title">Пояснение</div>
            <div className="container_message">{message}</div>
          </div>
          {/* Загрузка справочников для начала работы */}
          <FileUploadButton
            onFileUpload={onFileUpload}
            expectedInterface={{} as UOMItem} />

        </div>
        <div className="container_right">
          {/* Настройки */}
          {resource === 1 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Расписание работы предприятия</div>
            <CompanySchedule setMessage={setMessage}/>
            </div>}
          {/* Действия */}
          {resource === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Каталог производственных операций предприятия</div>
            <ActionsCatalog setMessage={setMessage}/>
          </div>}
          {/* ЕдИзм */}
          {resource === 3 &&
            <div className="contaitainer_catalog">
              <div className="catalog_title"> Каталог единиц измерения</div>
              <UOMSCatalog setMessage={setMessage}/>
            </div>}
          {/* Юниты */}
          {resource === 4 && <div className="contaitainer_catalog">            
            <UnitsCatalog setMessage={setMessage} />
          </div>}
        </div>

      </div>
    </Layout >
  )
}