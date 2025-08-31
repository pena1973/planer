import Layout from "@/components/Layout/layout";
import { useEffect, useState, useRef, use } from "react";
import { configureTokenAccess } from '@/lib/fetchWithRefresh'

import { downloadUoms } from '@/services/initial/downloadUoms';
import { downloadActions } from '@/services/initial/downloadActions';
import { downloadTemplates } from '@/services/initial/downloadTemplates';
import { downloadLoads } from '@/services/initial/downloadLoads';
import { downloadSchedule } from '@/services/initial/downloadSchedule';
import { downloadSettings } from '@/services/initial/downloadSettings';
import { downloadTCards } from '@/services/initial/downloadTCards';
// import { downloadProducts } from '@/services/initial/downloadProducts';
import { downloadUnits } from '@/services/initial/downloadUnits';
import { downloadUnutsActions } from '@/services/initial/downloadUnutsActions';
import { downloadUnutsExceptions } from '@/services/initial/downloadUnutsExceptions';

import { downloadUnutActions } from '@/services/initial/downloadUnut-Actions';
import { downloadUnutExceptions } from '@/services/initial/downloadUnut-Exceptions';
import { downloadUnitLoads } from '@/services/initial/downloadUnit-Loads';
import { downloadBaner } from '@/services/process/downloadBaner';




import { store } from '@/store' // путь к твоему Redux store

import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { createBills } from '@/services/admin/createBills';
import { deactivateTeamsByBalance } from '@/services/admin/deactivateTeamsByBalance';
import {

} from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");


export default function Admin() {
  const { t, i18n } = useTranslation();

  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [period, setPeriod] = useState<string>(getCurrentYM()); // 'YYYY-MM'

  const token = useSelector((state: RootState) => {
    return state.authSlice.token;
  })

  const user = useSelector((state: RootState) => {
    return state.authSlice.user;
  })

  const [message, setMessage] = useState('');
  const [messageLogin, setMessageLogin] = useState('');
  const [loginValue, setLoginValue] = useState('');
  const [passValue, setPassValue] = useState('');
  const [loaderButtonLogin, setLoaderButtonLogin] = useState(false);

  

  const createBillsHandler = async () => {
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      setMessage('Выберите год и месяц');
      return;
    }
    const [yStr, mStr] = period.split('-');
    const year = Number(yStr);
    const month = Number(mStr); // 1..12

    try {
      setMessage('');
      await createBills(token, year, month, t, setMessage);
      // при необходимости: push('/billing');
    } catch (e: any) {
      setMessage(e?.message || 'Не удалось сформировать счета');
    }
  };

  const deactivateTeams = async () => {
    await deactivateTeamsByBalance(token, t, setMessage);

  };


  return (
    <Layout>
      <div className="message_admin">{message}</div>
      <pre />
      <div className="container_admin">
        <div className="container_admin_left" >
          {user.isSystem && <div className="container_admin_block">
            Генерирует счета в БД, Они потом появятся у админа основной команды в виде инвойса
            счет на 1 число месяца генерит данные за предыдущий месяц.
            Заранее счета генерить не нужно потому что тогда конец анализа - сегодняшний день, вперед не работает.
            <label className="label_admin">
              <span>Выберите год и месяц</span>
              <input className="input_admin"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                min="2020-01"
                max="2035-12"
              />
            </label>

            <button
              onClick={createBillsHandler}
            >сформировать счeта</button>
          </div>}
          {user.isSystem && <div className="container_admin_block">
            Для команд у которых расход превышает баланс  кнопка переводит их в неактивные до пополнения баланса.
            Соотвеьтственно команды не смогут пользоватся программой
            <button
              onClick={deactivateTeams}
            >Деактивировать неплательшиков</button>

          </div>}
          {user.isSystem && <div className="container_admin_block"></div>}
          {user.isSystem && <div className="container_admin_block"></div>}
        </div>
        <div className="container_admin_midle">

          {user.isSystem && <div className="container_admin_block"></div>}
          {user.isSystem && <div className="container_admin_block"></div>}
          {user.isSystem && <div className="container_admin_block"></div>}
        </div>
        <div className="container_admin_right">
          {user.isSystem && <div className="container_admin_block">1</div>}
          {user.isSystem && <div className="container_admin_block"></div>}
          {user.isSystem && <div className="container_admin_block"></div>}
        </div>

      </div>

    </Layout>
  )
}

function getCurrentYM(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`; // 'YYYY-MM'
}

