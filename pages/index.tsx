import Layout from "@/components/Layout/layout";
import { useEffect, useState, useRef, use } from "react";
import Link from 'next/link';

import {
  UnitItem,
  UOMItem,
  ActionItem,
  TCardItem,
  UserItem,
  SettingsItem,
  ScheduleItem,
  UnitActionItem,
  UnitExceptionItem,
  UnitLoadItem,
  TeamItem,
  TemplateItem,

} from "@/types";

import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import Agreement from "@/components/index/Agreement/agreement";
import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import {
  setTeam, setToken, setUser,
  setUnitExceptions, setUnitActions,
  setActions,
  setUOMs, setUnits, setTCards,
  setSettings, setSchedule,
  setUnitLoads, setSignedAgreement,
  setTemplates,
} from '@/store/slices'

import words from "@/public/add.jpg";
import net from "@/public/add.jpg";
import learn from "@/public/add.jpg";
import exercises from "@/public/add.jpg";
import hearing from "@/public/add.jpg";
import topic from "@/public/add.jpg";

import {

} from '@/store/slices';

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

interface IndexProps {

}

export default function Index({ }: IndexProps) {
  const { t, i18n } = useTranslation();

  const { push } = useRouter();
  const dispatch = useAppDispatch();

  // login
  const [message, setMessage] = useState('');
  const [messageLogin, setMessageLogin] = useState('');
  const [messageRegister, setMessageRegister] = useState('');
  const [loginValue, setLoginValue] = useState('');
  const [passValue, setPassValue] = useState('');
  const [loaderButtonLogin, setLoaderButtonLogin] = useState(false);
  // const [loginMode, setLoginMode] = useState(false); // false- логин true - регистрация
  // register
  const [pass1Value, setPass1Value] = useState('');
  const [pass2Value, setPass2Value] = useState('');
  const [passMessage, setpassMessage] = useState('');
  const [nicknameValue, setNicknameValue] = useState('');
  const [teamNumberValue, setTeamNumberValue] = useState('');
  const [loaderButtonRegister, setLoaderButtonRegister] = useState(false);
  const [createTeamValue, setCreateTeamValue] = useState(false);

  // agreement для временного хранения
  // const [textAgreementValue, setTextAgreementValue] = useState("");
  const agreementId = useRef(0);
  const textAgreement = useRef("");

  // управление страницей
  const [step, setStep] = useState(2);
  // 1-регистер
  // 2-логин
  // 3-соглашение
  // 4-лоадер
  // 5-мастер заполнения

  const team = useSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const token = useSelector((state: RootState) => {
    return state.authSlice.token;
  })
  const user = useSelector((state: RootState) => {
    return state.authSlice.user;
  })
  const signedAgreement = useSelector((state: RootState) => {
    return state.authSlice.signedAgreement;
  })

  // // для выбора из списка
  // let role = useRef("planer");

  // status 0 - архив, 1 актив, 2 запрос 
  const loginClick = async (e: React.MouseEvent<HTMLElement>) => {
    setLoaderButtonLogin(true)
    if (loginValue.length < 0) {
      setMessageLogin(t('service.loginNotEntered'));
      setLoaderButtonLogin(false);
      return
    };

    if (passValue.length < 1) {
      setMessageLogin(t('service.passnNotEntered'));
      setLoaderButtonLogin(false);
      return
    }

    try {

      const res = await fetch(`api/login-api`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            login: loginValue,
            pass: passValue,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessageLogin(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessageLogin(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)

        if (receivedData.success) {
          let user_ = receivedData.user as UserItem;
          let token_ = receivedData.token as string;
          let team_ = receivedData.team as TeamItem;
          let settings_ = receivedData.settings as SettingsItem;
          let agreementText_ = receivedData.agreementText as string;
          let signed_ = receivedData.signed as boolean;
          let agreementId_ = receivedData.agreementId as number

          //   Обновим настройки
          dispatch(setUser(user_));
          dispatch(setToken(token_));
          dispatch(setTeam(team_));
          dispatch(setSettings(settings_));
          dispatch(setSignedAgreement(signed_));
          // setTextAgreementValue(agreementText_);
          agreementId.current = agreementId_;
          textAgreement.current=agreementText_;
          setStep(3);
        } else setMessageLogin(receivedData.message);
      }

    } catch (e: any) {
      // setMessageLogin(t('service.noConnection') + e.message)            
    }
    setLoaderButtonLogin(false)
  }
  const loginRecovery = async (e: React.MouseEvent<HTMLElement>) => {

    if (loginValue.length < 5) {
      setMessage(t('service.loginNotEntered'));
      return
    };

    // генерим ссылку восстановления и запоминаем юзера на восстановление   
    // setLoaderButtonRecovery(true)
    const URL_RECOVERY = process.env.NEXT_PUBLIC_URL_RECOVERY;
    let _urlRecovery = String(URL_RECOVERY);
    _urlRecovery = _urlRecovery.concat((_urlRecovery[_urlRecovery.length - 1] === "/") ? "" : "/");
    let link = _urlRecovery + "recovery/";
    try {
      //  нужно отправить писмо на восстановление      
      const res = await fetch(`${_url}auth/mailrecovery`,
        {
          method: 'post',
          headers: new Headers({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ 'login': loginValue, 'link': link }),
        }
      );

      if (res.status !== 200)
        setMessage(t('service.serverUnavailable') + res.status);
      else {
        //  написать сообщение юзеру что писмо отправлено       
        // setMessage('Вам на почту отправлено письмо со ссылкой на страницу восстановления пароля!');    
        // setMessage(' An email with a link to the password recovery page has been sent to your email!');          
        // setMessage(' Jums ir nosūtīts e-pasts ar saiti uz paroles atkopšanas lapu!');          
        // setMessage(' Вам на пошту надіслано листа з посиланням на сторінку відновлення пароля!');          
        setMessage(t('service.recoveryMailSent'));
      }
    } catch (e: any) {
      setMessage(t('service.noConnection') + e.message)
    }
    // setLoaderButtonRecovery(false);
  }
  const registerClick = async (e: React.MouseEvent<HTMLElement>) => {

    setLoaderButtonRegister(true)
    // if (loginValue.length < 5) {
    //   setMessageRegister(t('service.loginLengthMustBe'));
    //   setMessageRegister("Длина логина должна быть не менее 5 символов и содержать @  и . ");
    //   setLoaderButtonRegister(false);
    //   return
    // };

    // if (pass1Value.length < 1) {
    //   setMessageRegister(t('service.passLengthMustBe'));
    //   setMessageRegister("Длина пароля должна быть не менее 12 символов. пароль должен содержать буквы, цифры  и специальные символы");
    //   setLoaderButtonRegister(false);
    //   return
    // }

    // if (teamNumberValue.length === 0 && !createTeamValue) {
    //   setMessageRegister(t('service.roleNotSelected'));
    //   setMessageRegister("Не выбрана команда");
    //   setLoaderButtonRegister(false);
    //   return
    // };

    // if (nicknameValue.length < 1) {
    //   setMessageRegister(t('service.nicknameNotSelected'));
    //   setMessageRegister("Не выбран псевдоним");
    //   setLoaderButtonRegister(false);
    //   return
    // };

    // if (pass1Value !== pass2Value) {
    //   setMessageRegister(t('service.pass1NotEqualPass2'));
    //   setMessageRegister("Пароль и его повтор не совпадают");
    //   setLoaderButtonRegister(false);
    //   return
    // };

    //  далее адресуем на страницу соглашения и после этого регистрируем, 
    // загружаем начальное состояние а потом на мастер настроек


    try {

      const res = await fetch(`api/register-api`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            login: loginValue,
            pass: pass1Value,
            teamNumber: teamNumberValue,
            createTeam: createTeamValue,
            nickname: nicknameValue,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessageRegister(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessageRegister(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)

        if (receivedData.success) {

          let user_ = receivedData.user as UserItem;
          let token_ = receivedData.token as string;
          let team_ = receivedData.team as TeamItem;
          let settings_ = receivedData.settings as SettingsItem;
          let agreementText_ = receivedData.agreementText as string;
          let agreementId_ = receivedData.agreementId as number

          //   Обновим настройки
          dispatch(setUser(user_));
          dispatch(setToken(token_));
          dispatch(setTeam(team_));
          dispatch(setSettings(settings_));
          dispatch(setSignedAgreement(false));
          // setTextAgreementValue(agreementText_);
          agreementId.current = agreementId_;
          textAgreement.current = agreementText_
          //  далее адресуем на страницу соглашения и после этого переправляем на страницу настроек
          setStep(3);
          // setMessageRegister("Обновлены настройки");
        } else setMessageRegister(receivedData.error);
      }

    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }


    setLoaderButtonRegister(false)
  }

  // НАЧАЛЬАЯ ЗАГРУЗКА
  const downloadUoms = async () => {
    try {
      const res = await fetch(`api/uoms-api?userId=${user.id}&teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          let uoms_ = receivedData.uoms as UOMItem[]
          dispatch(setUOMs(uoms_));
          setMessage("Загружены единицы измерения")          
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
  }
  const downloadActions = async () => {
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/actions-api?userId=${user.id}&teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          let actions_ = receivedData.actions as ActionItem[]
          dispatch(setActions(actions_));
          setMessage("Загружены действия")          
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  }
  const downloadTemplates = async () => {
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/templates-api?userId=${user.id}&teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          let templates_ = receivedData.templates as TemplateItem[]
          dispatch(setTemplates(templates_));
          setMessage("Загружены шаблоны")          
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  }

  const downloadUnits = async () => {
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/units-api?userId=${user.id}&teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          let units_ = receivedData.units as UnitItem[]
          dispatch(setUnits(units_));
          setMessage("Загружены юниты")
          // if ((downloadedAllValue+1)===6) setMessage("Все загружено, можно работать")
          //   setdownloadedAllValue(downloadedAllValue+1);
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  }
  const downloadUnutsExceptions = async () => {
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/exceptions-api?userId=${user.id}&teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          let exceptions = receivedData.exceptions as UnitExceptionItem[]
          dispatch(setUnitExceptions(exceptions)); // Это ме надо?
          setMessage("Загружены исключения юнитов")
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  }
  const downloadUnutsActions = async () => {
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/unit-actions-api?userId=${user.id}&teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          let unitActions = receivedData.exceptions as UnitActionItem[]
          dispatch(setUnitActions(unitActions)); 
          setMessage("Загружены действия юнитов")
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  }

  // загружает активные карты  
  const downloadTCards = async () => {
    try {
      const res = await fetch(`/api/tcards-api?teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)        
        if (receivedData.success) {
          let tCards = receivedData.tCards as TCardItem[]
          // Сортируем tCards по номеру (если number это число)
          let tCards_ = tCards.sort((a, b) => a.idc - b.idc);
          let tCardsUpdated = tCards_.map(card => { return { ...card, date: card.date, status: card.status } });
          dispatch(setTCards(tCardsUpdated));
          setMessage("Загружены карты");
          // if ((downloadedAllValue+1)===6) setMessage("Все загружено, можно работать")
          //   setdownloadedAllValue(downloadedAllValue+1);
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
  };
  // загружает настройки отображения календаря
  const downloadSettings = async () => {
    try {
      const res = await fetch(`api/settings-api?teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          let settings = receivedData.schedule as SettingsItem
          dispatch(setSettings(settings));
          setMessage("Загружены настройки календаря");
          // if ((downloadedAllValue+1)===6) setMessage("Все загружено, можно работать")
          //   setdownloadedAllValue(downloadedAllValue+1);
        }
        else
          setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
  }
  
  // загружает  расписание работы компании
  const downloadSchedule = async () => {
    try {
      const res = await fetch(`api/schedule-api?userId=${user.id}&teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        // setMessage(t('service.serverUnavailable') + res.status);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          let schedule = receivedData.schedule as ScheduleItem
          dispatch(setSchedule(schedule));
          setMessage("Загружено расписание")
          // if ((downloadedAllValue+1)===6) setMessage("Все загружено, можно работать")
          //   setdownloadedAllValue(downloadedAllValue+1);
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }
  }
  // запрос Загрузки
  const downloadLoads = async () => {

    try {
      const res = await fetch(`/api/loads-api?userId=${user.id}&teamId=${team.id}`,
        {
          method: 'get',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessage(error);
        // setMessage(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)        
        if (receivedData.success) {
          //  массив юнитов с загрузками

          let unitsLoads = (receivedData.unitsLoads as UnitLoadItem[])

          dispatch(setUnitLoads(unitsLoads));
          setMessage("Загружены планы и история ")
        }
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }


    // }

    // // Обновим сообщение для пользователя
    // setMessage(`Элемент с id: ${itemId} был перемещен`);
  };


  useEffect(() => {
    const loadDataAndRedirect = async () => {
      // Если юзер залогинен и получен токен
      if (team && user && token.trim() !== "" && signedAgreement) {
        setStep(4);
        // setShowLoader(true);
        await downloadUoms();
        await downloadActions();
        await downloadTemplates();
        await downloadUnits();
        await downloadUnutsActions();
        await downloadUnutsExceptions();
        await downloadSettings();        
        await downloadSchedule();
        await downloadTCards();
        await downloadLoads();
        // Скрываем лоадер   включаем мастер заполнения (пока заглушка)
        setStep(5);
        // Переходим на страницу "cards"
        push("/cards");
      }
    };
    loadDataAndRedirect();  // Вызываем асинхронную функцию
  }, [user, token, team, signedAgreement]);  // Зависимости от user, token и team

  const signAgreement = async (signedAgreement: boolean, agreementId: number) => {
    // обращаемся к базе и подписываем соглашение
    // после этого переходим к загрузке начальных таблиц
    // после этого вываливаемся на начальные настройки
    try {

      const res = await fetch(`api/agreement-api`,
        {
          method: 'post',
          headers: new Headers({
            // 'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            userId: user.id,
            signedAgreement: signedAgreement,
            agreementId: agreementId,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        setMessageLogin(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessageLogin(t('service.serverUnavailable') + res.status);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)

        if (receivedData.success) {

          let signed_ = receivedData.signed as boolean;
          //   Обновим настройки          
          dispatch(setSignedAgreement(signed_));
          setStep(4);
        } else setMessageLogin(receivedData.message);
      }

    } catch (e: any) {
      // setMessageLogin(t('service.noConnection') + e.message)            
    }
    setLoaderButtonLogin(false)

  }

  // отказ регистрироватся на этапе подписания
  const cancelSignAgreement = () => {
    setStep(2);
  }


  return (
    <Layout>
      <pre />
      <div className="container_index">
        {(step !== 3) && <div className="container_index_left">
          <div className="index_title">Planing tool</div>
          <div className="index_describtion">Планировщик загрузки ресурсов компании
            <div className="index_line"></div>
          </div>
          <div className="ads"><Image className="img_" src={words} alt="words" />Работает в соответствии с заказом от клиента</div>
          <div className="ads"><Image className="img_" src={exercises} alt="words" />Выстраивает технологическую карту выполнения заказа</div>
          <div className="ads"><Image className="img_" src={hearing} alt="words" />Отслеживает кажый произведенный предмет индивидуально</div>
          <div className="ads"><Image className="img_" src={net} alt="words" /> Формирует индивидуальный код каждого изделия, легко найти</div>
          <div className="ads"><Image className="img_" src={topic} alt="words" />Автоматически моделирует загрузку ваших приизводственных центров</div>
          <div className="ads"><Image className="img_" src={learn} alt="words" />Формирует задания исполнителям и отслеживает выполнение</div>
        </div>}
        {(step !== 3) && <div className="container_index_right">

          {(step === 2) &&
            <div className="login_container">
              <div className="login_input_container">
                <input className="login_input"
                  type="email"
                  id="email"
                  value={loginValue}
                  placeholder={t('login.email')}
                  onChange={(e) => setLoginValue(e.target.value)}
                  required autoComplete="off" />
              </div>
              <div className="login_input_container">
                <input className="login_input"
                  type="password"
                  id="password"
                  value={passValue}
                  placeholder={t('login.pass')}
                  onChange={(e) => { setPassValue(e.target.value) }}
                  required autoComplete="off" />
              </div>

              <div className="login_link_container">
                <div className="login_link" onClick={(e) => loginRecovery(e)}>{t('login.buttonForgot')}</div>
              </div>

              <div className="login_button_container">
                <button className="login_button" onClick={(e) => loginClick(e)} >
                  {loaderButtonLogin && <ButtonLoader />}
                  {!loaderButtonLogin && t('login.buttonLogin')}
                </button>
              </div>


              <div className="login_link_container">
                <div className="login_link" onClick={(e) => {
                  setStep(1);
                  setMessageLogin("");
                }}>{t('login.register')}
                </div>
              </div>

              <div className="login_message_container">
                <div className="login_message">&nbsp;&nbsp;{messageLogin}</div>
              </div>

            </div>}

          {(step === 1) &&
            <div className="register_container">
              <div className="register_input_container">
                {/* <div className="register_title">{t('register.email')}: </div> */}
                <input className="register_input"
                  type="email"
                  id="email"
                  placeholder={t('register.email')}
                  value={loginValue} onChange={(e) => setLoginValue(e.target.value)}
                  required autoComplete="off" />
              </div>

              <div className="register_input_container">
                {/* <div className="register_title">{t('register.pass')}:</div> */}

                <input className="register_input"
                  type="password"
                  id="password"
                  placeholder={t('register.pass')}
                  value={pass1Value}
                  onChange={(e) => {
                    if (pass2Value !== e.target.value)
                      setpassMessage(t('register.compare'));
                    else setpassMessage("");
                    setPass1Value(e.target.value)
                  }} required autoComplete="off" />

                <div className="register_pass_message_container">&nbsp;&nbsp;{passMessage}</div>

                <input className="register_input"
                  type="password"
                  id="passwordrepeat"
                  value={pass2Value}
                  placeholder={t('register.repeatpass')}
                  onChange={(e) => {
                    if (pass1Value !== e.target.value)
                      setpassMessage(t('register.compare'));
                    else setpassMessage("");
                    setPass2Value(e.target.value)
                  }} required autoComplete="off" />

              </div>

              <div className="register_input_container">
                <label>Create team
                  &nbsp; &nbsp;
                  <input
                    className="register_input"
                    id="showWeekend"
                    autoComplete="off"
                    checked={createTeamValue}
                    type="checkbox"
                    onChange={e => {
                      setCreateTeamValue(!createTeamValue)
                    }}
                  />
                </label>

                {!createTeamValue && <input
                  className="register_input"
                  type="text"
                  id="role"
                  placeholder="Team number"
                  value={teamNumberValue}
                  onChange={(e) => setTeamNumberValue(e.target.value)}
                  required autoComplete="off" />}



              </div>

              {/* <DropdownSelectRole
                options={options}
                onSelect={handleSelectRole}
                selectedValue={selectedRole}
              /> */}

              <div className="register_input_container">

                <div className="register_notice">{t('register.visible')}: </div>
                <input className="register_input"
                  type="text"
                  id="role"
                  placeholder={t('register.nickname')}
                  value={nicknameValue}
                  onChange={(e) => setNicknameValue(e.target.value)}
                  required autoComplete="off" />
              </div>

              <div className="register_button_container">
                <button className="register_button"
                  onClick={(e) => registerClick(e)}>
                  {loaderButtonRegister && <ButtonLoader />}
                  {!loaderButtonRegister && t('register.buttonRegister')}
                </button>
              </div>
              <div className="register_link_container">
                <div className="register_link" onClick={(e) => {
                  setStep(2);
                  setMessage("");
                }}>{t('register.login')}
                </div>
              </div>

              <div className="register_message_container">
                <div className="register_message">&nbsp;&nbsp;{messageRegister}</div>
              </div>
            </div>
          }
          {(step === 4) &&
            <div className="loader_container">
              <div className="loader_title">Ждем...</div>
              <div className="loader_title">{message}</div>
              <pre />
              <ButtonLoader width={200} height={200} />
            </div>
          }
        </div>}
        {(step === 3) && <Agreement
          user={user}
          textAgreement={textAgreement.current}
          agreementId={agreementId.current}
          signAgreement={signAgreement}
          cancelSignAgreement={cancelSignAgreement}
          setMessage={(message: string) => { }}
        />}
      </div>
    </Layout>
  )
}