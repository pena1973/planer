import Layout from "@/components/Layout/layout";


import { SupportMessages } from "@/components/support/SupportMessages/supportMessages";
import { Billing } from "@/components/support/Billing/billing";
import { Profile } from "@/components/support/Profile/profile";
import { CookiePolicyBlock } from '@/components/CookiePolicyBlock/сookiePolicyBlock'
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

import { setSuportPoint } from '@/store/slices';


export default function Support() {
  const { t, i18n } = useTranslation();
  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках


  const token = useSelector((state: RootState) => {
    return state.authSlice.token;
  })

  const suportPoint = useSelector((state: RootState) => {
    return state.viewSlice.suportPoint;
  })

  const team = useSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useSelector((state: RootState) => {
    return state.authSlice.user;
  })

  const unit = useSelector((state: RootState) => {
    return state.authSlice.unit;
  })

  // Начальный загруз
  useEffect(() => {

  }, []);

  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
          <div className="container_catalogs">
            <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(1))}>{t('support.messages')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(2))}>{t('support.billing')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(3))}>{t('support.profile')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(4))}>{t('support.cookie')}</div>
          </div>
          <div className="container_cards_title">{t('support.notes')}</div>
          <div className="container_global_message">{message}</div>

        </div>
        <div className="container_global_right">
          {/* Настройки */}
          {suportPoint === 1 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.messages1')}</div>
            <SupportMessages
              setMessage={setMessage}
              teamId={team.id}
              userId={user.id}
              token={token}
            />
          </div>}
          {/* Действия */}
          {suportPoint === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.billing1')}</div>
            <Billing
              teamId={team.id}
              userId={user.id}
              setMessage={setMessage}
              token={token}
            />
          </div>}
          {/* Действия */}
          {suportPoint === 3 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.profile1')}</div>
            <Profile
              team={team}
              user={user}
              unit={unit}
              setMessage={setMessage}
              token={token}
            />
          </div>}
          {/* политика куки */}
          {suportPoint === 4 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.cookie')}</div>
            <CookiePolicyBlock />

          </div>}
        </div>

      </div>
    </Layout >
  )
}