import Layout from "@/components/Layout/layout";


import { SupportMessages } from "@/components/support/SupportMessages/supportMessages";
import { Billing } from "@/components/support/Billing/billing";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { useTranslation } from 'react-i18next';
import { } from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface SupportProps {

}

export default function Support({ }: SupportProps) {
  const { t, i18n } = useTranslation();
  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  const [resource, setResource] = useState(1); // переключатель между каталогами

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
            <div className="resources_container_catalog" onClick={() => setResource(1)}>{t('support.messages')}</div>
            <div className="resources_container_catalog" onClick={() => setResource(2)}>{t('support.billing')}</div>
            <div className="resources_container_catalog" onClick={() => setResource(3)}>{t('support.profile')}</div>
          </div>
          <div className="container_cards_title">{t('support.notes')}</div>
          <div className="container_global_message">{message}</div>

        </div>
        <div className="container_global_right">
          {/* Настройки */}
          {resource === 1 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.messages1')}</div>
            <SupportMessages
              setMessage={setMessage}
              teamId={team.id}
              userId={user.id}
            />
          </div>}
          {/* Действия */}
          {resource === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.billing1')}</div>
            <Billing            
              teamId={team.id}
              userId={user.id}
              setMessage={setMessage}
            />
          </div>}
          {/* Действия */}
          {resource === 3 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.profile1')}</div>
            {/* <Billing            
              teamId={team.id}
              userId={user.id}
              setMessage={setMessage}
            /> */}
          </div>}
        </div>

      </div>
    </Layout >
  )
}