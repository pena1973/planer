import Layout from "@/components/Layout/layout";
import FileUploadButton from "@/components/cards/FileUploadButton/fileUploadButton";
import UOMSCatalog from "@/components/catalogs/UOMSCatalog/uomsCatalog";
import ActionsCatalog from "@/components/catalogs/ActionsCatalog/аctionsCatalog";
import TeamSchedule from "@/components/catalogs/TeamSchedule/teamSchedule";
import Settings from "@/components/catalogs/Settings/settings";
import SystemSettings from "@/components/catalogs/SystemSettings/systemSettings";
import Team from "@/components/catalogs/Team/team";
import UsersCatalog from "@/components/catalogs/UsersCatalog/usersCatalog";

import UnitsCatalog from "@/components/catalogs/UnitsCatalog/unitsCatalog";
// import Arrow1 from "@/components/Arrow1/arrow1";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { ActionItem, UOMItem, UnitItem, UserItem } from '@/types'

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";


import {
  setResourcePoint
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
  const [resource, setResource] = useState(0); // переключатель между каталогами

  const resourcePoint = useSelector((state: RootState) => {
    return state.viewSlice.resourcePoint;
  })

  const team = useSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useSelector((state: RootState) => {
    return state.authSlice.user;
  })

  // Начальный загруз
  useEffect(() => {

  }, []);


 

  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
          <div className="container_catalogs">
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(1))}>Команда</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(2))}>Расписание</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(3))}>Действия</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(4))}>Единицы измерения</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(5))}>Юниты</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(6))}>Настройки</div>


          </div>
          <div className="container_cards_title">Пояснение</div>
          <div className="container_global_message">{message}</div>

        </div>
        <div className="container_global_right">
          {/* компания */}
          {resourcePoint === 1 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Команда</div>          
            <Team
              user={user}
              team={team}
              setMessage={setMessage}              
            />
            <pre/>
            <UsersCatalog
            user={user}
              team={team}              
              setMessage={setMessage}

            />
          </div>}
          {/* расписание */}
          {resourcePoint === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Расписание работы команды</div>
            <TeamSchedule setMessage={setMessage} />
          </div>}
          {/* Действия */}
          {resourcePoint === 3 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Каталог производственных операций команды</div>
            <ActionsCatalog setMessage={setMessage} />
          </div>}
          {/* ЕдИзм */}
          {resourcePoint === 4 &&
            <div className="contaitainer_catalog">
              <div className="catalog_title"> Каталог единиц измерения</div>
              <UOMSCatalog setMessage={setMessage} />
            </div>}
          {/* Юниты */}
          {resourcePoint === 5 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Каталог производственных центров (юнитов) и настройки</div>
            <UnitsCatalog setMessage={setMessage} />
          </div>}
          {/* Визуальные настройки календаря */}
          {resourcePoint === 6 && <div className="contaitainer_catalog">
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