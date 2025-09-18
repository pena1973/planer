import Layout from "@/components/Layout/layout";
import { useEffect, useState, useRef, use } from "react";

import ScheduleEditor from "@/components/admin/ScheduleEditor/scheduleEditor";
import { SupportMailsAdmin } from "@/components/admin/SupportMailsAdmin/supportMailsAdmin";

import { JobSettingItem, BanerItem } from '@/types/service-types'


import { store } from '@/store' // путь к твоему Redux store

import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import { useRouter } from 'next/navigation';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

// import { createBills } from '@/services/admin/createBills';
import { deactivateTeams } from '@/services/admin/deactivateTeams';
import { setJobSetting } from '@/services/admin/setJobSetting';
import { setBaner } from '@/services/admin/setBaner';

import {

} from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");


export default function Admin() {
  const { t, i18n } = useTranslation();

  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [periodCreateInv, setPeriodCreateInv] = useState<string>(getCurrentYM()); // 'YYYY-MM'
  const [periodDeactTeam, setPeriodDeactTeam] = useState<string>(getCurrentYM()); // 'YYYY-MM'

  // банер
  const [bannerText, setBannerText] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [banerLocale, setBanerLocale] = useState("");

  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })

  const user = useAppSelector((state: RootState) => {
    return state.authSlice.user;
  })

  if (!user.isSystem) push('/support')

  const [message, setMessage] = useState('');

  const setBanerHandler = async () => {
    if (!bannerText) return
    if (!periodFrom) return
    if (!periodTo) return
    const baner = {
      message: bannerText,
      dateFrom: periodFrom,
      dateTo: periodTo,
      locale: banerLocale,
    } as BanerItem
    await setBaner(token, user.id, baner, t, setMessage);

  }

  const deactivateTeamsHandler = async () => {
    if (!periodDeactTeam || !/^\d{4}-\d{2}$/.test(periodDeactTeam)) {
      setMessage('Выберите год и месяц');
      return;
    }
    const [yStr, mStr] = periodDeactTeam.split('-');
    const year = Number(yStr);
    const month = Number(mStr); // 1..12
    await deactivateTeams(token, t, setMessage);
  };

  const setJobSettinghandler = async (jobSetting: JobSettingItem) => {
    await setJobSetting(token, user.id, jobSetting, t, setMessage);
  };

  return (
    <Layout>
      <div className="container_global" >

        <div className="container_admin">
          <div className="container_admin_left" >            
            {user.isSystem && <div className="container_admin_block">
              Сообщения
              <code>{message}</code>

            </div>}


            {user.isSystem && <div className="container_admin_block">
              Установка расписания рег задания
              <ScheduleEditor onSubmit={setJobSettinghandler} />


              Список рег заданий с ключами:
              <ol>
                <li>списание баланса — <span>billing:charge</span></li>
                <li>очистка 90 дней — <span>cleanup:core</span></li>
              </ol>


            </div>}

            {user.isSystem && <div className="container_admin_block">
              <code>Для команд у которых расход превышает баланс
                кнопка переводит их в неактивные до пополнения баланса.
                Соотвеьтственно команды не смогут пользоватся программой</code>

              <button onClick={deactivateTeamsHandler}>Деактивировать неплательшиков</button>

            </div>}


          </div>
          <div className="container_admin_midle">

            {user.isSystem && <div className="container_admin_block">
              Сообщения в тех поддержку
              <SupportMailsAdmin
                userId={user.id}
                setMessage={setMessage}
                token={token}
              /></div>}

          </div>
          <div className="container_admin_right">
            {user.isSystem && <div className="container_admin_block">
              Установка банера
              {/* Текст баннера */}
              <label className="label_baner">
                <span>Текст баннера</span>
                <input
                  className="input_baner"
                  type="text"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="Введите текст баннера"
                />
                <span>locale</span>
                <input
                  className="input_locale"
                  type="text"
                  value={banerLocale}
                  onChange={(e) => setBanerLocale(e.target.value)}
                  placeholder="ru"
                />
              </label>

              {/* Период действия */}
              <div className="period_baner">
                <label className="label_baner">
                  <span>Действует с</span>
                  <input
                    className="input_baner"
                    type="date"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    min="2020-01-01"
                    max="2035-12-31"
                  />
                </label>

                <label className="label_baner">
                  <span>По</span>
                  <input
                    className="input_baner"
                    type="date"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    min="2020-01-01"
                    max="2035-12-31"
                  />
                </label>

              </div>
              <button onClick={setBanerHandler}>Установить</button>

            </div>}

          </div>

        </div>
      </div>
    </Layout >
  )
}

function getCurrentYM(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`; // 'YYYY-MM'
}

