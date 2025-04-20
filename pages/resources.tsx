import Layout from "@/components/Layout/layout";
import FileUploadButton from "@/components/cards/FileUploadButton/fileUploadButton";
import UOMSCatalog from "@/components/catalogs/UOMSCatalog/uomsCatalog";
import ActionsCatalog from "@/components/catalogs/ActionsCatalog/аctionsCatalog";
import TeamSchedule from "@/components/catalogs/TeamSchedule/teamSchedule";
import Settings from "@/components/catalogs/Settings/settings";
import SystemSettings from "@/components/catalogs/SystemSettings/systemSettings";

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


  // Начальный загруз
  useEffect(() => {

  }, []);


  const onFocusUnitHandler = (code: string) => {
    // console.log('Code:', code);
    // Дальнейшая обработка данных
  };


  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
            <div className="container_catalogs">
              <div className="resources_container_catalog" onClick={() => setResource(0)}>Команда</div>
              <div className="resources_container_catalog" onClick={() => setResource(1)}>Расписание</div>
              <div className="resources_container_catalog" onClick={() => setResource(2)}>Действия</div>
              <div className="resources_container_catalog" onClick={() => setResource(3)}>Единицы измерения</div>
              <div className="resources_container_catalog" onClick={() => setResource(4)}>Юниты</div>
              <div className="resources_container_catalog" onClick={() => setResource(5)}>Настройки</div>
              

            </div>
            <div className="container_cards_title">Пояснение</div>
            <div className="container_global_message">{message}</div>

        </div>
        <div className="container_global_right">
          {/* компания */}
          {resource === 0 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Команда</div>
            Номер команды
            И пользователи команды с назначенными ролями
          </div>}
          {/* расписание */}
          {resource === 1 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Расписание работы предприятия</div>
            <TeamSchedule setMessage={setMessage} />
          </div>}
          {/* Действия */}
          {resource === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Каталог производственных операций предприятия</div>
            <ActionsCatalog setMessage={setMessage} />
          </div>}
          {/* ЕдИзм */}
          {resource === 3 &&
            <div className="contaitainer_catalog">
              <div className="catalog_title"> Каталог единиц измерения</div>
              <UOMSCatalog setMessage={setMessage} />
            </div>}
          {/* Юниты */}
          {resource === 4 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Настройки юнитов</div>
            <UnitsCatalog setMessage={setMessage} />
          </div>}
          {/* Визуальные настройки календаря */}
          {resource === 5 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Настройки календаря</div>
            <Settings setMessage={setMessage} />
            <div className="catalog_title"> Настройки учета</div>
            <SystemSettings setMessage={setMessage} />
          </div>}
        </div>

      </div>
    </Layout >
  )
}