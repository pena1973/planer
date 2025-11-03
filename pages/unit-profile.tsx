import Layout from "@/components/Layout/layout";
import { Profile } from "@/components/support/Profile/profile";

import { useTranslation } from 'react-i18next';
import { useState } from "react";


import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import { useRouter } from 'next/navigation';


export default function UnitProfile() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
 
  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })
  if (!token) push('/')

  const team = useAppSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useAppSelector((state: RootState) => {
    return state.authSlice.user;
  })
  const unit = useAppSelector((state: RootState) => {
    return state.authSlice.unit;
  })

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