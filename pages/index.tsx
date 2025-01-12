import Layout from "@/components/Layout/layout";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { UnitItem,UOMItem, TCardProductItem, ActionItem, TCardOperationItem, TCardItem, UserItem, UserRoleEnum } from "@/types";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
// import DropDownList from "@/components/DropDownList/dropDownList";
import DropdownSelectRole from "@/components/DropdownSelectRole/dropdownSelectRole";
import { useTranslation } from 'react-i18next';

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setActions, setUOMs, setUnits, } from '@/store/slices'

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

  const [message, setMessage] = useState('');
  const [loginValue, setLoginValue] = useState('');
  const [passValue, setPassValue] = useState('');
  const [loaderButtonLogin, setLoaderButtonLogin] = useState(false);
  const [loginMode, setLoginMode] = useState(false); // true- логин false - регистрация

  const [pass1Value, setPass1Value] = useState('');
  const [pass2Value, setPass2Value] = useState('');
  const [passMessage, setpassMessage] = useState('');
  const [nicknameValue, setNicknameValue] = useState('');
  const [loaderButtonRegister, setLoaderButtonRegister] = useState(false);

  const options = [
    { id: UserRoleEnum.OPERATOR, title: "Оператор" },
    { id: UserRoleEnum.PLANNER, title: "Планер" },
    { id: UserRoleEnum.UNIT, title: "Юнит" }
  ];

  let user = {} as UserItem;

  let token = '';
  let agreement = false;


  // для выбора из списка
  let role = useRef("planer");

  // status 0 - архив, 1 актив, 2 запрос 
  const loginClick = async (e: React.MouseEvent<HTMLElement>) => {
    setLoaderButtonLogin(true)
    // if (loginValue.length < 5) {
    //   setMessage(t('service.loginNotEntered'));
    //   setLoaderButtonLogin(false);
    //   return
    // };

    // if (passValue.length < 1) {
    //   setMessage(t('service.passnNotEntered'));
    //   setLoaderButtonLogin(false);
    //   return
    // }

    // try { // передаем в базу запрос на токен
    //   const res = await fetch(`${_url}auth/login`,
    //     {
    //       method: 'post',
    //       headers: new Headers({
    //         'Content-Type': 'application/json'
    //       }),
    //       body: JSON.stringify({ 'login': loginValue, 'pass': passValue }),
    //     }
    //   );

    //   if (res.status !== 200) {
    //     setMessage(t('service.serverUnavailable') + res.status);
    //   }
    //   else {
    //     const receivedData = await res.json();
    //     if (receivedData.success) {
    //       user = receivedData.user as UserItem;
    //       token = receivedData.token as string;
    //       plan = receivedData.plan as PlanItem;
    //       tutors = receivedData.tutors as { assignedTutorIds: number[], requiredTutorIds: number[] }
    //       topics = receivedData.topics as TopicItem[];
    //       agreement = receivedData.agreement as boolean;

    //       dispatch(setToken(token));
    //       dispatch(setUserId(user.id));
    //       dispatch(setLogin(user.login));
    //       dispatch(setLimit(user.limit));

    //       dispatch(setLangL(user.langL));
    //       dispatch(setLangN(user.langN));
    //       dispatch(setlangNId(user.langNId));
    //       dispatch(setlangLId(user.langLId));
    //       dispatch(setRole(user.role));
    //       dispatch(setNickname(user.nickname));

    //       dispatch(setAssignedTutorIds(tutors.assignedTutorIds));
    //       dispatch(setRequiredTutorIds(tutors.requiredTutorIds));


    //       dispatch(setPlan(plan));
    //       let sortedTopics = [] as TopicItem[]
    //       if (topics) sortedTopics = sortByTopicName(topics, user.langN);
    //       dispatch(setTopics(sortedTopics));

    //       setCookie(`userAgreeCookie`, String(user.cookieAgree), 365);
    //       setMessage("")
    //       dispatch(setAgreement(agreement));
    //       if (!agreement) {
    //         push(`/agreement`)
    //       } else push(`/play`);

    //     }
    //     else setMessage(receivedData.error);
    //   }
    // } catch (e: any) {
    //   setMessage(t('service.noConnection') + e.message)
    //   console.log(t('service.noConnection') + e.message);
    // }
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
    if (loginValue.length < 5) {
      setMessage(t('service.loginLengthMustBe'));
      // setMessage("Длина логина должна быть не менее 5 символов и содержать @  и . "); 
      setLoaderButtonRegister(false);
      return
    };

    if (pass1Value.length < 1) {
      setMessage(t('service.passLengthMustBe'));
      // setMessage("Длина пароля должна быть не менее 12 символов. пароль должен содержать буквы, цифры  и специальные символы"); 
      setLoaderButtonRegister(false);
      return
    }

    if (!role.current) {
      setMessage(t('service.roleNotSelected'));
      // setMessage("Не выбрана роль");   
      setLoaderButtonRegister(false);
      return
    };
    if (nicknameValue.length < 1) {
      setMessage(t('service.nicknameNotSelected'));
      // setMessage("Не выбран псевдоним");   
      setLoaderButtonRegister(false);
      return
    };

    if (pass1Value !== pass2Value) {
      setMessage(t('service.pass1NotEqualPass2'));
      // setMessage("Пароль и его повторение не совпадают");   
      setLoaderButtonRegister(false);
      return
    };

    // try {
    //   const res = await fetch(`${_url}auth/register`,
    //     {
    //       method: 'post',
    //       headers: new Headers({
    //         'Content-Type': 'application/json'
    //       }),
    //       body: JSON.stringify({
    //         'login': loginValue,
    //         'pass': pass1Value,
    //         'locale': i18n.language,
    //         'cookieAgree': (userAgreeCookie === "true") ? true : false,
    //         'langNId': langNId.current,
    //         'langN': langN.current,
    //         'langLId': langLId.current,
    //         'langL': langL.current,
    //         "role": role.current,
    //         "nickname": nicknameValue
    //       }),
    //     }
    //   );
    //   if (res.status !== 200) {
    //     setMessage(t('service.serverUnavailable') + res.status);           
    //   } else {
    //     const receivedData = await res.json();
    //     if (receivedData.success) {
    //       user = receivedData.user as UserItem;
    //       token = receivedData.token as string;

    //       //  План старт
    //       plan = receivedData.plan as PlanItem;
    //       topics = receivedData.topics as TopicItem[];

    //       dispatch(setToken(token));
    //       dispatch(setUserId(user.id));
    //       dispatch(setLogin(user.login));
    //       dispatch(setLimit(user.limit));
    //       dispatch(setLangL(user.langL));
    //       dispatch(setLangN(user.langN));
    //       dispatch(setlangNId(user.langNId));
    //       dispatch(setlangLId(user.langLId));
    //       dispatch(setRole(user.role));
    //       dispatch(setNickname(user.nickname));
    //       dispatch(setPlan(plan));
    //       dispatch(setAgreeCookie(user.cookieAgree)); // Согласие на куки

    //       let sortedTopics = [] as TopicItem[]
    //       if (topics) sortedTopics = sortByTopicName(topics, user.langN);
    //       dispatch(setTopics(sortedTopics));

    //       setMessage("")
    //       push(`/agreement`);
    //     }
    //     else setMessage(receivedData.error);
    //   }
    // } catch (e: any) {
    //   setMessage(t('service.noConnection') + e.message)      
    //   console.log(t('service.noConnection') + e.message);

    // }
    setLoaderButtonRegister(false)
  }

  const downloadUoms = async () => {
    try {
      const res = await fetch(`api/uoms-api?userId=${1}&companyId=${1}`,
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
      const res = await fetch(`api/actions-api?userId=${1}&companyId=${1}`,
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
      const res = await fetch(`api/units-api?userId=${1}&companyId=${1}`,
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
        }
        else setMessage(receivedData.error);
      }
    } catch (e: any) {
      // setMessage(t('service.noConnection') + e.message)            
    }

  }

  useEffect(() => {
    downloadUoms();
    downloadActions();
    downloadUnits();
  }, []);

  const [selectedRole, setSelectedRole] = useState<UserRoleEnum | null>(null);

  const handleSelectRole = (selectedOption: { id: UserRoleEnum, title: string } | null) => {
    if (selectedOption) {
      setSelectedRole(selectedOption.id);
    }
  };

  return (
    <Layout>
      <pre />
      <div className="ind_container">
        <div className="ind_left">
          <div className="ind_title">Planer</div>
          <div className="ind_describtion">Планировщик загрузки ресурсов компании
            <div className="ind_line"></div>
          </div>
          <div className="ads"><Image className="img_" src={words} alt="words" />Работает в соответствии с заказом от клиента</div>
          <div className="ads"><Image className="img_" src={exercises} alt="words" />Выстраивает технологическую карту выполнения заказа</div>
          <div className="ads"><Image className="img_" src={hearing} alt="words" />Отслеживает кажый произведенный предмет индивидуально</div>
          <div className="ads"><Image className="img_" src={net} alt="words" /> Формирует индивидуальный код каждого изделия, легко найти</div>
          <div className="ads"><Image className="img_" src={topic} alt="words" />Автоматически моделирует загрузку ваших приизводственных центров</div>
          <div className="ads"><Image className="img_" src={learn} alt="words" />Формирует задания исполнителям и отслеживает выполнение</div>
        </div>
        <div className="ind_right">

          {loginMode && <div className="login_container">
            <div className="login_input_container">
              <div className="login_title">{t('login.email')}: </div>
              <input className="login_input" type="email" id="email"
                value={loginValue} onChange={(e) => setLoginValue(e.target.value)}
                required autoComplete="off" />
            </div>
            <div className="login_input_container">
              <div className="login_title">{t('login.pass')}: </div>
              <input className="login_input" type="password" id="password"
                value={passValue} onChange={(e) => { setPassValue(e.target.value) }}
                required autoComplete="off" />
            </div>

            <div className="login_link_container">
              <div className="login_link_forgot" onClick={(e) => loginRecovery(e)}>{t('login.buttonForgot')}</div>
            </div>

            <div className="login_button_container">
              <button className="blue_button" onClick={(e) => loginClick(e)} >
                {loaderButtonLogin && <ButtonLoader />}
                {!loaderButtonLogin && t('login.buttonLogin')}
              </button>
            </div>

            <div className="login_message_container">
              <div className="login_message">{message}</div>
            </div>
            <div className="login_link_container">
              <div className="login_link" onClick={(e) => {
                setLoginMode(false);
                setMessage("");
              }}>{t('login.register')}
              </div>
            </div>

          </div>}
          {!loginMode &&
            <div className="register_container">
              <div className="register_input_container">
                <div className="register_title">{t('register.email')}: </div>
                <input className="register_input" type="email" id="email"
                  value={loginValue} onChange={(e) => setLoginValue(e.target.value)}
                  required autoComplete="off" />
              </div>

              <div className="register_input_container">
                <div className="register_title">{t('register.pass')}:</div>

                <input className="register_input" type="password" id="password" value={pass1Value} onChange={(e) => {
                  if (pass2Value !== e.target.value)
                    setpassMessage(t('register.compare'));
                  else setpassMessage("");
                  setPass1Value(e.target.value)
                }} required autoComplete="off" />

                <div className="register_message_container">&nbsp;&nbsp;{passMessage}</div>

                <input className="register_input" type="password" id="passwordrepeat" value={pass2Value} onChange={(e) => {
                  if (pass1Value !== e.target.value)
                    setpassMessage(t('register.compare'));
                  else setpassMessage("");
                  setPass2Value(e.target.value)
                }} required autoComplete="off" />

              </div>
              {/* язык родной */}
              <DropdownSelectRole
                options={options}
                onSelect={handleSelectRole}
                selectedValue={selectedRole}
              />

              <div className="register_input_container">
                <div className="register_title">{t('register.nickname')}: </div>
                <div >{t('register.visible')}: </div>
                <input className="register_input" type="text" id="role"
                  value={nicknameValue} onChange={(e) => setNicknameValue(e.target.value)}
                  required autoComplete="off" />
              </div>
              <div className="register_button_container">
                <button className="blue_button"
                  onClick={(e) => registerClick(e)}>
                  {loaderButtonRegister && <ButtonLoader />}
                  {!loaderButtonRegister && t('register.buttonRegister')}
                </button>
              </div>

              <div className="register_message_container">
                <div className="register_message">&nbsp;&nbsp;{message}</div>
              </div>

              <div className="register_link_container">
                <div className="register_link" onClick={(e) => {
                  setLoginMode(true);
                  setMessage("");
                }}>{t('register.login')}
                </div>
              </div>

            </div>
          }
        </div>

      </div>
    </Layout>
  )
}