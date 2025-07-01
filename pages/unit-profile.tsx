import Layout from "@/components/Layout/layout";
import { Profile } from "@/components/support/Profile/profile";

import  Docs  from "@/components/support/Docs/docs";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from "react";

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

export default function Monitor() {

  const { t, i18n } = useTranslation();

  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  

  const token = useSelector((state: RootState) => {
    return state.authSlice.token;
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

  useEffect(() => {
  
  
  }, []);

  

 
  

  return (
    <Layout>
      <div className="container_global" >
        <div className="container_unit_interface" >
        <div className="catalog_title">{t('support.profile1')}</div>
        <Profile
              team={team}
              user={user}
              unit={unit}
              setMessage={setMessage}
              token={token}
            />
      </div>
      </div>
    </Layout >
  )
}