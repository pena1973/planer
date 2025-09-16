import Layout from "@/components/Layout/layout";
import { SupportMessages } from "@/components/support/SupportMails/supportMails";
import { Billing } from "@/components/support/Billing/billing";
import { Profile } from "@/components/support/Profile/profile";
import { CookiePolicyBlock } from '@/components/CookiePolicyBlock/сookiePolicyBlock'
import Docs from "@/components/support/Docs/docs";
import { useEffect, useState, useMemo } from "react";
import { generateTeamNumber } from '@/lib/client/utils.client'

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { } from '@/store/slices';

import { setSuportPoint } from '@/store/slices';

export default function Support() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках

  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })

  const suportPoint = useAppSelector((state: RootState) => {
    return state.viewSlice.suportPoint;
  })

  const team = useAppSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useAppSelector((state: RootState) => {
    return state.authSlice.user;
  })

  const unit = useAppSelector((state: RootState) => {
    return state.authSlice.unit;
  })

  const schedule = useAppSelector((state: RootState) => {
    return state.catalogSlice.schedule;
  })

  const isMainTeam = useMemo(() => team ? team.main_team === generateTeamNumber(team.prefix, team.id) : false, [team]);

  // Начальный загруз
  useEffect(() => {

  }, []);

  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
          <div className="container_catalogs">
            <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(1))}>{t('support.messages')}</div>
            {isMainTeam && <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(2))}>{t('support.billing')}</div>}
            <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(3))}>{t('support.profile')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(4))}>{t('support.cookie')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setSuportPoint(5))}>{t('support.docs')}</div>
          </div>
          <div className="container_cards_title">{t('support.notes')}</div>
          <div className="container_global_message">{message}</div>

        </div>
        <div className="container_global_right">
          {/* Сообщения тех поддержки */}
          {suportPoint === 1 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.messages1')}</div>
            <SupportMessages
              setMessage={setMessage}
              teamId={team.id}
              userId={user.id}
              token={token}
              timezone={schedule.timeZone}
            />
          </div>}
          {/* Счета */}
          {suportPoint === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.billing1')}</div>
            <Billing
              timezone={schedule.timeZone}
              team={team}
              user={user}
              setMessage={setMessage}
              token={token}
              isMainTeam={isMainTeam}
             
            />
          </div>}
          {/* Профиль */}
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
          {/* Куки */}
          {suportPoint === 4 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.cookie')}</div>
            <CookiePolicyBlock />

          </div>}
          {/* Документация */}
          {suportPoint === 5 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('support.docs')}</div>
            <Docs />

          </div>}
        </div>

      </div>
    </Layout >
  )
}