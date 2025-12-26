import Layout from "@/components/Layout/layout";
import { useState, } from "react";

import ScheduleEditor from "@/components/admin/ScheduleEditor/scheduleEditor";
import { SupportMailsAdmin } from "@/components/admin/SupportMailsAdmin/supportMailsAdmin";
import { Leads } from "@/components/admin/Leads/leads";
import { Usages } from "@/components/admin/Usages/usages";

import { JobSettingItem, BanerItem } from '@/types/service-types'

import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import { useRouter } from 'next/navigation';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import { deactivateTeams } from '@/services/admin/deactivateTeams';
import { setJobSetting } from '@/services/admin/setJobSetting';
import { setBaner } from '@/services/admin/setBaner';



import galb from "@/public/arrow-gray-up.png"; // галочка вниз
import galt from "@/public/arrow-gray-down.png"; // галочка вверх

import {

} from '@/store/slices';
import { JobSettings } from "@/components/admin/JobSettings/jobSettings";

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

  // раскрытие блоков
  const [expandUsage, setExpandUsage] = useState(false);
  const [expandJobs, setExpandJobs] = useState(false);
  const [expandMails, setExpandMails] = useState(false);
  const [expandLeads, setExpandLeads] = useState(false);
  const [expandBaher, setExpandBaher] = useState(false);

  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })

  if (!token) push('/')

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
    await setBaner(token, user.id, baner, t, i18n.language, setMessage);

  }

  const deactivateTeamsHandler = async () => {
    if (!periodDeactTeam || !/^\d{4}-\d{2}$/.test(periodDeactTeam)) {
      setMessage('Выберите год и месяц');
      return;
    }
    const [yStr, mStr] = periodDeactTeam.split('-');
    const year = Number(yStr);
    const month = Number(mStr); // 1..12
    await deactivateTeams(user.id, token, t, i18n.language, setMessage);
  };

  // const setJobSettinghandler = async (jobSetting: JobSettingItem) => {
  //   await setJobSetting(user.id, jobSetting, token, t, i18n.language, setMessage);
  // };

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

              <div className={"section_title"}>
                Установка расписания рег задания
                <Image
                  className={"icon_bill"}
                  src={expandJobs ? galb : galt} alt="usage" width={20} height={20}
                  onClick={(e) => { setExpandJobs(!expandJobs); }}
                />
              </div>
              {expandJobs &&
                // <><ScheduleEditor
                //   token={token}
                //   userId={user.id}
                //   setMessage={setMessage}
                //   onSubmit={setJobSettinghandler} />

                //   Список рег заданий с ключами:
                //   <ol>
                //     <li>списание баланса — <span>billing:charge</span></li>
                //     <li>очистка 90 дней — <span>cleanup:core</span></li>
                //   </ol>
                //   Состояния рег заданий (доделать)

                // </>
                <JobSettings
                  userId={user.id}
                  setMessage={setMessage}
                  token={token}
                />}
            </div>}

            {user.isSystem && <div className="container_admin_block">
              <code>Для команд у которых расход превышает баланс
                кнопка переводит их в неактивные до пополнения баланса.
                Соотвеьтственно команды не смогут пользоватся программой</code>

              <button onClick={deactivateTeamsHandler}>Деактивировать неплательшиков</button>

            </div>}
            {user.isSystem && <div className="container_admin_block">
              <div className={"section_title"}>
                Ед. использования сервиса командами
                <Image
                  className={"icon_bill"}
                  src={expandUsage ? galb : galt} alt="usage" width={20} height={20}
                  onClick={(e) => { setExpandUsage(!expandUsage); }}
                />
              </div>

              {expandUsage && <Usages
                userId={user.id}
                setMessage={setMessage}
                token={token}
              />}
            </div>}

          </div>
          <div className="container_admin_midle">

            {user.isSystem && <div className="container_admin_block">

              <div className={"section_title"}>
                Сообщения в тех поддержку
                <Image
                  className={"icon_bill"}
                  src={expandMails ? galb : galt} alt="usage" width={20} height={20}
                  onClick={(e) => { setExpandMails(!expandMails); }}
                />
              </div>
              {expandMails &&
                <SupportMailsAdmin
                  userId={user.id}
                  setMessage={setMessage}
                  token={token}
                />}
            </div>}

          </div>
          <div className="container_admin_right">
            {user.isSystem && <div className="container_admin_block">
              <div className={"section_title"}>
                Установка банера
                <Image
                  className={"icon_bill"}
                  src={expandBaher ? galb : galt} alt="usage" width={20} height={20}
                  onClick={(e) => { setExpandBaher(!expandBaher); }}
                />
              </div>

              {/* Текст баннера */}
              {expandBaher && <> <label className="label_baner">
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
              </>}
            </div>}
            {user.isSystem && <div className="container_admin_block">
              <div className={"section_title"}>
                Лиды
                <Image
                  className={"icon_bill"}
                  src={expandLeads ? galb : galt} alt="usage" width={20} height={20}
                  onClick={(e) => { setExpandLeads(!expandLeads); }}
                />
              </div>

              {expandLeads && <Leads
                userId={user.id}
                setMessage={setMessage}
                token={token}
              />}
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

