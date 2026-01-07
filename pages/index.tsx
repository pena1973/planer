import Layout from "@/components/Layout/layout";
import { useEffect, useState, useRef } from "react";
import { configureTokenAccess } from '@/lib/client/fetchWithRefresh'

import { downloadUoms } from '@/services/initial/downloadUoms';
import { downloadActions } from '@/services/initial/downloadActions';
import { downloadTemplates } from '@/services/initial/downloadTemplates';
import { downloadLoads } from '@/services/initial/downloadLoads';
import { downloadSchedule } from '@/services/initial/downloadSchedule';
import { downloadSettings } from '@/services/initial/downloadSettings';
import { downloadTCards } from '@/services/initial/downloadTCards';
import { downloadUnits } from '@/services/initial/downloadUnits';
import { downloadUnutsActions } from '@/services/initial/downloadUnutsActions';
import { downloadUnutsExceptions } from '@/services/initial/downloadUnutsExceptions';
import { downloadTeams } from '@/services/initial/downloadTeams';


import { signAgreement } from '@/services/initial/signAgreement';

import { downloadUnutActions } from '@/services/initial/downloadUnut-Actions';
import { downloadUnutExceptions } from '@/services/initial/downloadUnut-Exceptions';
import { downloadUnitLoads } from '@/services/initial/downloadUnit-Loads';
import { downloadBaner } from '@/services/process/downloadBaner';

import { loginHandler } from '@/services/login/loginHandler';
import { registerHandler } from '@/services/login/registerHandler';
import { sendCodeHandler } from '@/services/login/sendCodeHandler';

import { store } from '@/store' // путь к твоему Redux store

import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import Agreement from "@/components/index/Agreement/agreement";
import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import { useRouter } from 'next/navigation';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import { setLoadingComplete, setStep } from '@/store/slices'

import ico1 from "@/public/ico1.png";
import ico2 from "@/public/ico2.png";
import ico3 from "@/public/ico5.png";
import ico4 from "@/public/ico3.png";
import ico5 from "@/public/ico4.png";
import ico6 from "@/public/ico6.png";

export default function Index() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const { push } = useRouter();
  const dispatch = useAppDispatch();

  // login
  const [message, setMessage] = useState('');
  const [messageLogin, setMessageLogin] = useState('');
  const [messageLogin1, setMessageLogin1] = useState('');
  const [messageRegister, setMessageRegister] = useState('');
  const [loginValue, setLoginValue] = useState('');
  const [passValue, setPassValue] = useState('');
  const [loaderButtonLogin, setLoaderButtonLogin] = useState(false);
  // register
  const [pass1Value, setPass1Value] = useState('');
  const [pass2Value, setPass2Value] = useState('');
  const [passMessage, setpassMessage] = useState('');
  const [nicknameValue, setNicknameValue] = useState('');
  const [teamNumberValue, setTeamNumberValue] = useState('');
  const [loaderButtonRegister, setLoaderButtonRegister] = useState(false);
  const [createTeamValue, setCreateTeamValue] = useState(true);
  const [basedOnTeamValue, setBasedOnTeamValue] = useState(false);
  const [basedTeamNumberValue, setBasedTeamNumberValue] = useState('');

  // agreement для временного хранения
  const agreementId = useRef(0);
  const textAgreement = useRef("");
  const localeAgreement = useRef("");

  // управление страницей
  // const [step, setStep] = useState(2);
  // 1-регистер
  // 2-логин
  // 3-соглашение
  // 4-лоадер
  // 5-мастер заполнения

  const team = useAppSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })

  const user = useAppSelector((state: RootState) => {
    return state.authSlice.user;
  })
  const unit = useAppSelector((state: RootState) => {
    return state.authSlice.unit;
  })
  const signedAgreement = useAppSelector((state: RootState) => {
    return state.authSlice.signedAgreement;
  })
  const step = useAppSelector((state: RootState) => {
    return state.viewSlice.step;
  })
  // status 0 - архив, 1 актив, 2 запрос 
  const loginClick = async (e: React.MouseEvent<HTMLElement>) => {
    setLoaderButtonLogin(true)
    if (loginValue.length === 0) {
      setMessageLogin(t('service.loginNotEntered'));
      setLoaderButtonLogin(false);
      return
    };

    if (passValue.length < 1) {
      setMessageLogin(t('service.passnNotEntered'));
      setLoaderButtonLogin(false);
      return
    }

    await loginHandler({
      login: loginValue,
      pass: passValue,
      token,
      t,
      locale,
      setMessage: setMessage,
      setMessageLogin: setMessageLogin,
      dispatch,      
      agreementIdRef: agreementId,
      agreementTextRef: textAgreement,
      agreementlocaleRef:localeAgreement,
      configureTokenAccess,
      store,
    });

    setLoaderButtonLogin(false)
  }

  // Восстановление пароля
  const loginRecovery = async (e: React.MouseEvent<HTMLElement>) => {
    if (loginValue.length < 5) {
      setMessage(t('service.loginNotEntered'));
      return
    };
    if (loginValue) {
      await sendCodeHandler(loginValue, 'password_reset', t, i18n.language, setMessageLogin);
    }
  }
  // Регистрация
  const registerClick = async (e: React.MouseEvent<HTMLElement>) => {
    setLoaderButtonRegister(true)

    if (loginValue.length < 5) {
      setMessageRegister(t('service.loginLengthMustBe'));
      setLoaderButtonRegister(false);
      return
    };

    if (pass1Value.length < 6) {
      setMessageRegister(t('service.passLengthMustBe'));
      setLoaderButtonRegister(false);
      return
    }

    if (nicknameValue.length < 1) {
      setMessageRegister(t('service.nicknameNotSelected'));
      setLoaderButtonRegister(false);
      return
    };

    if (pass1Value !== pass2Value) {
      setMessageRegister(t('service.pass1NotEqualPass2'));
      setLoaderButtonRegister(false);
      return
    };

    //  далее адресуем на страницу соглашения и после этого регистрируем, 
    // загружаем начальное состояние а потом на мастер настроек

    await registerHandler({
      login: loginValue,
      pass: pass1Value,
      teamNumber: teamNumberValue,
      createTeam: createTeamValue,
      basedOnTeam: basedOnTeamValue,
      basedTeamNumber: basedTeamNumberValue,
      nickname: nicknameValue,
      token,
      t,
      locale,
      setMessage: setMessage,
      setMessageRegister: setMessageRegister,
      dispatch,
      // setStep,
      agreementIdRef: agreementId,
      agreementTextRef: textAgreement,
    });
    setLoaderButtonRegister(false)
  }

  useEffect(() => {
    // мейла подтверждение юзера
    const confirmEmailAndRedirect = async () => {
      if (user.login && !user?.confirmed && token.trim() !== "") {
        await sendCodeHandler(user.login, 'signup', t, i18n.language, setMessage);
      }
    };
    confirmEmailAndRedirect();
  }, [user]);

  useEffect(() => {
    // ждем подтверждения мейла
    setMessageLogin("");
    setMessageLogin1("");
    if (token.trim() !== "" && !user?.confirmed) {

      if (team.id && user.id) {
        setMessageLogin(t('service.toPost') + user.login + t('service.sentCodeMail'));
        setMessageLogin1( t('service.text_TTL'));
      } else {
        setMessageLogin("");
        setMessageLogin1("");
      }
      dispatch(setStep(2));
      dispatch(setLoadingComplete(true))
      return;
    }

    const loadDataAndRedirect = async () => {

      dispatch(setLoadingComplete(false))
      // Если юзер залогинен и получен токен
      if (team.id && user && token.trim() !== "" && signedAgreement && user?.confirmed) {
        dispatch(setStep(4));
        if (user.isAdmin) {
          await downloadBaner(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadUoms(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadActions(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadTemplates(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadUnits(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadUnutsActions(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadUnutsExceptions(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadSettings(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadSchedule(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadTCards(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadLoads(user.id, team.id, token, t, locale, setMessage, dispatch);

          // если это системный юзер(поддержка), то грузим все команды
          if (user.isSystem)
            await downloadTeams(user.id, token, t, locale, setMessage, dispatch);

          // Скрываем лоадер   включаем мастер заполнения (пока заглушка)
          dispatch(setStep(5));
          // Переходим на страницу "cards"
          push("/cards");
        }
        else {
          // Только для одного юнита           
          await downloadBaner(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadUoms(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadActions(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadUnutActions(unit?.id, user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadUnutExceptions(unit?.id, user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadSettings(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadSchedule(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadTCards(user.id, team.id, token, t, locale, setMessage, dispatch);
          await downloadUnitLoads(unit?.id, user.id, team.id, token, t, locale, setMessage, dispatch);
          // Скрываем лоадер   включаем мастер заполнения (пока заглушка)
          dispatch(setStep(5));
          // Переходим на страницу "cards"
          push("/unit-interface");
        }
        dispatch(setLoadingComplete(true))
      }
    };

    loadDataAndRedirect();  // Вызываем асинхронную функцию
  }, [user, token, team, signedAgreement]);  // Зависимости от user, token и team

  const signAgreementHandler = async (signedAgreement: boolean, agreementId: number) => {
    // обращаемся к базе и подписываем соглашение
    // после этого переходим к загрузке начальных таблиц
    // после этого вываливаемся на начальные настройки
    await signAgreement(user.id, agreementId, textAgreement.current, localeAgreement.current, signedAgreement, token, t, locale, setMessageLogin,
      // setStep, 
      setMessage, dispatch)
  }

  // отказ регистрироватся на этапе подписания
  const cancelSignAgreementHandler = () => {
    dispatch(setStep(2));
  }

  return (
    <Layout>
      <pre />
      <div className="container_index">
        {(step !== 3) && <div className="container_index_left">
          <div className="index_title">Plan-Track.Pro</div>
          <div className="index_describtion">{t('index.title')}
            <div className="index_line"></div>
          </div>

          <div className="ads"><Image className="img_" src={ico1} alt="ico1" />{t('index.ico1')}</div>
          <div className="ads"><Image className="img_" src={ico2} alt="ico2" />{t('index.ico2')}</div>
          <div className="ads"><Image className="img_" src={ico3} alt="ico3" />{t('index.ico3')}</div>
          <div className="ads"><Image className="img_" src={ico4} alt="ico4" />{t('index.ico4')}</div>
          <div className="ads"><Image className="img_" src={ico5} alt="ico5" />{t('index.ico5')}</div>
          <div className="ads"><Image className="img_" src={ico6} alt="ico6" />{t('index.ico6')}</div>
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
                  required
                />
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
                  dispatch(setStep(1));
                  setMessageLogin("");
                  setMessageLogin1("");
                }}>{t('login.register')}
                </div>
              </div>

              <div className="login_message_container">
                <div className="login_message">&nbsp;&nbsp;{messageLogin}</div>
                {messageLogin1 !=="" && <pre/>}
                {messageLogin1 !=="" && <div className="login_message">&nbsp;&nbsp;{messageLogin1}</div>}
              </div>

            </div>}

          {(step === 1) &&
            <div className="register_container">
              <div className="register_input_container">
                <input className="register_input"
                  type="email"
                  id="email"
                  placeholder={t('register.email')}
                  value={loginValue} onChange={(e) => setLoginValue(e.target.value)}
                  required
                />
              </div>

              <div className="register_input_container">
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
                <div className="register_input_container_row">
                  <label>
                    Create team
                    <input
                      className="register_input"
                      id="showWeekend"
                      autoComplete="off"
                      checked={createTeamValue}
                      type="checkbox"
                      onChange={e => setCreateTeamValue(!createTeamValue)}
                    />
                  </label>

                  {createTeamValue && (
                    <label>
                      based on
                      <input
                        className="register_input"
                        id="showWeekend"
                        autoComplete="off"
                        checked={basedOnTeamValue}
                        type="checkbox"
                        onChange={e => setBasedOnTeamValue(!basedOnTeamValue)}
                      />
                    </label>
                  )}
                </div>
                {basedOnTeamValue && (
                  <input
                    className="register_input"
                    type="text"
                    id="role"
                    placeholder="Based on team number"
                    value={basedTeamNumberValue}
                    onChange={e => setBasedTeamNumberValue(e.target.value)}
                    required
                    autoComplete="off"
                  />
                )}
                {!createTeamValue && (
                  <input
                    className="register_input"
                    type="text"
                    id="role"
                    placeholder="Team number"
                    value={teamNumberValue}
                    onChange={e => setTeamNumberValue(e.target.value)}
                    required
                    autoComplete="off"
                  />
                )}
              </div>

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
                  dispatch(setStep(2));
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
              <div className="loader_title">{t('index.wait')}...</div>
              <div className="loader_title">{message}</div>
              <pre /><pre /><pre />
              <ButtonLoader width={200} height={200} />
            </div>
          }
        </div>}
        {(step === 3) && <Agreement
          user={user}
          textAgreement={textAgreement.current}
          agreementId={agreementId.current}
          signAgreement={signAgreementHandler}
          cancelSignAgreement={cancelSignAgreementHandler}
          setMessage={(message: string) => { }}
        />}
      </div>

    </Layout>
  )
}