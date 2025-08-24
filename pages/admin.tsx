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

import { loginHandler } from '@/services/login/loginHandler';
import { registerHandler } from '@/services/login/registerHandler';

import { store } from '@/store' // путь к твоему Redux store

import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import Agreement from "@/components/index/Agreement/agreement";
import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { setSignedAgreement, setLoadingComplete } from '@/store/slices'

import ico1 from "@/public/ico1.png";
import ico2 from "@/public/ico2.png";
import ico3 from "@/public/ico5.png";
import ico4 from "@/public/ico3.png";
import ico5 from "@/public/ico4.png";
import ico6 from "@/public/ico6.png";
import { createBills } from '@/services/admin/createBills';
import {

} from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");


export default function Admin() {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  const { push } = useRouter();
  const dispatch = useAppDispatch();

  const token = useSelector((state: RootState) => {
    return state.authSlice.token;
  })
  
  const createBillsHandler = async () => {
    await createBills(token, 2025,8, t, setMessage);

  };


  return (
    <Layout>
      <pre />
      <div className="container_index">

        <button
          onClick={createBillsHandler}
        >сформировать счeта</button>
      </div>

    </Layout>
  )
}