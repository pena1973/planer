import Layout from "@/components/Layout/layout";

import UOMSCatalog from "@/components/resources/UOMSCatalog/uomsCatalog";
import ActionsCatalog from "@/components/resources/ActionsCatalog/аctionsCatalog";
import TemplatesCatalog from "@/components/resources/TemplatesCatalog/templatesCatalog";
import TeamSchedule from "@/components/resources/TeamSchedule/teamSchedule";
import Settings from "@/components/resources/Settings/settings";
import SystemSettings from "@/components/resources/SystemSettings/systemSettings";
import Team from "@/components/resources/Team/team";
import UsersCatalog from "@/components/resources/UsersCatalog/usersCatalog";

import UnitsCatalog from "@/components/resources/UnitsCatalog/unitsCatalog";
import { useState } from "react";
import { useTranslation } from 'react-i18next';

import { YYYYMMDD } from "@/lib/common/utils";
import { ulogger } from "./../lib/common/universal-logger";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { useRouter } from 'next/navigation';

import { setResourcePoint } from '@/store/slices';

export default function Resources() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках

  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })

  const resourcePoint = useAppSelector((state: RootState) => {
    return state.viewSlice.resourcePoint;
  })
  const team = useAppSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useAppSelector((state: RootState) => {
    return state.authSlice.user;
  })
  //показывает текущее состояние активности команды
  const activeTeam = useAppSelector((state: RootState) => {
    return state.viewSlice.activeTeam;
  })
  if (!activeTeam) push('/support')
  
  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
          <div className="container_catalogs">
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(1))}>{t('resources.team')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(2))}>{t('resources.schedule')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(3))}>{t('resources.actions')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(4))}>{t('resources.uoms')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(5))}>{t('resources.units')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(6))}>{t('resources.setting')}</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setResourcePoint(7))}>{t('resources.templates')}</div>
          </div>
          <div className="container_cards_title">{t('resources.notes')}</div>
          <div className="container_global_message">{message}</div>

        </div>
        <div className="container_global_right">
          {/* компания */}
          {resourcePoint === 1 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('resources.team')}</div>
            <Team
              user={user}
              team={team}
              setMessage={setMessage}
              token={token}
            />
            <pre />
            <UsersCatalog
              user={user}
              team={team}
              setMessage={setMessage}
              token={token}

            />
          </div>}
          {/* расписание */}
          {resourcePoint === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('resources.teamschedule')}</div>
            <TeamSchedule
              setMessage={setMessage}
              token={token} />
          </div>}
          {/* Действия */}
          {resourcePoint === 3 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('resources.teamactions')}</div>
            <ActionsCatalog
              setMessage={setMessage}
              token={token}
            />
          </div>}
          {/* ЕдИзм */}
          {resourcePoint === 4 &&
            <div className="contaitainer_catalog">
              <div className="catalog_title">{t('resources.uoms')}</div>
              <UOMSCatalog setMessage={setMessage} />
            </div>}
          {/* Юниты */}
          {resourcePoint === 5 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('resources.teamunits')}</div>
            <UnitsCatalog setMessage={setMessage} />
          </div>}
          {/* Визуальные настройки календаря */}
          {resourcePoint === 6 && <div className="contaitainer_catalog">
            <div className="catalog_title">{t('resources.calendarsetting')}</div>
            <Settings
              setMessage={setMessage}
              token={token}
            />
            <div className="catalog_title"> {t('resources.accauntingsetting')}</div>
            <SystemSettings
              setMessage={setMessage}
              token={token}
            />
          </div>}
          {resourcePoint === 7 &&
            <div className="contaitainer_catalog">
              <div className="catalog_title">{t('resources.cardtemplates')}</div>
              <TemplatesCatalog
                setMessage={setMessage}
                token={token}
              />
            </div>}
        </div>

      </div>
    </Layout >
  )
}