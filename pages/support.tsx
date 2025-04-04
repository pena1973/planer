import Layout from "@/components/Layout/layout";
import FileUploadButton from "@/components/FileUploadButton/fileUploadButton";

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


  // Загрузка файла
  const onFileUpload = (content: UOMItem | ActionItem | UnitItem) => {
    // console.log('File uploaded with content:', content);
    // Дальнейшая обработка данных
  };

  return (
    <Layout>
      <div className="container" >
        <div className="container_left">
          <div className="container_left_inner">

            <div className="container_catalogs">
              <div className="resources_container_catalog" onClick={()=> setResource(1)}>Обращения</div>
              <div className="resources_container_catalog" onClick={()=> setResource(2)}>Оплаты</div>
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
            <div className="catalog_title"> Обращения в тех. поддержку</div>
            {/* <CompanySchedule setMessage={setMessage} /> */}
            </div>}
          {/* Действия */}
          {resource === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title"> Счета и оплаты</div>
            {/* <ActionsCatalog setMessage={setMessage}/> */}
          </div>}          
        </div>

      </div>
    </Layout >
  )
}