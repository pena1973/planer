
import React, { useEffect, useState, useRef } from 'react';
import styles from "./profile.module.scss";
import { UserItem, TeamItem, UnitItem } from "@/types";
import { useTranslation } from 'react-i18next';
import { generateTeamNumber } from '@/utils'
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { useAppDispatch } from "@/pages/_app";

import { setUser } from '@/store/slices'

interface ProfileProps {
  setMessage: (message: string) => void,
  team: TeamItem,
  user: UserItem,
  unit: UnitItem,
  token:string
}

export const Profile: React.FC<ProfileProps> = ({
  // messages,
  setMessage,
  team,
  user,
  unit,
  token
}) => {

  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const [userValue, setUserValue] = useState({} as UserItem);

  const [passValue, setPassValue] = useState(''); // старый пароль
  const [newPass1Value, setNewPass1Value] = useState(''); // новый пароль
  const [newPass2Value, setNewPass2Value] = useState(''); // новый пароль повтор
  const [loaderButtonName, setLoaderButtonName] = useState(false);
  const [loaderButtonPass, setLoaderButtonPass] = useState(false);
  const [nameValue, setNameValue] = useState(''); // имя юзера
  const [changePassValue, setChangePassValue] = useState(false);
  const [changeNameValue, setChangeNameValue] = useState(false);

  useEffect(() => {
    setUserValue(user)
  }, [user]);


  const changePass = async () => {
    setMessage("");
    setLoaderButtonPass(true)
    if (newPass1Value !== newPass2Value)
      return
    // запрос на сохранение
    try {
      // запрос получение текста из БД вместе со словами     textId: number, userId:number
      const res = await fetch(`api/profile-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            userId: user.id,
            teamId: team.id,
            oldpass: passValue,
            newpass: newPass1Value,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        // setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessage(t('service.serverUnavailable') + error);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)

        if (receivedData.success) {
          //   Обновим текущую карту
          let user_ = receivedData.user as UserItem
          dispatch(setUser(user_));
          setPassValue("");
          setNewPass1Value("");
          setNewPass2Value("");
          setMessage(t('profile.passUpdated'));
        } else setMessage(receivedData.error);
      }

    } catch (e: any) {
      setMessage(t('service.serverUnavailable') + e.message)
    }
    setLoaderButtonPass(false)
  }

  const changeName = async () => {
    setMessage("");
    setLoaderButtonName(true)
    // запрос на сохранение
    try {
      // запрос получение текста из БД вместе со словами     textId: number, userId:number
      const res = await fetch(`api/profile-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            userId: user.id,
            teamId: team.id,
            name: nameValue,
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        let error = receivedData.error;
        // setMessage(error);
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessage(t('service.serverUnavailable') + error);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)

        if (receivedData.success) {
          //   Обновим текущую карту
          let user_ = receivedData.user as UserItem
          dispatch(setUser(user_));
          setNameValue("")
          setMessage(t('profile.userUpdated'));
        } else setMessage(receivedData.error);
      }

    } catch (e: any) {
      setMessage(t('service.serverUnavailable') + e.message)
    }
    setLoaderButtonName(false)
  }

  const teamNumberValue = generateTeamNumber(team.prefix, team.id);
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <span className={styles.title_span}>{t('profile.id')}:&nbsp; &nbsp;</span>
        #{userValue.id}
      </div>
      <div className={styles.title}>
        <span className={styles.title_span}>{t('profile.name')}&nbsp; &nbsp;</span>
        {userValue.name}
      </div>
      {/* СМЕНА ИМЕНИ */}
      <div>
        <div className={styles.checkbox_input_container}>
          <label>{t('profile.changeName')}</label>
          &nbsp; &nbsp;
          <input
            id="userNameCheckbox"
            autoComplete="off"
            checked={changeNameValue}
            type="checkbox"
            onChange={e => {
              setChangeNameValue(!changeNameValue)
            }}
          />
        </div>

        {/* Новое имя */}
        {changeNameValue && <div className={styles._input_container}>
          <input
            className={styles._input}
            type="text"
            id="userName"
            value={nameValue}
            placeholder={t('profile.name')}
            onChange={(e) => { setNameValue(e.target.value) }}
            required autoComplete="off" />
        </div>}

        {changeNameValue && <div className={styles._button_container}>
          <button className={styles.profile_button}
            onClick={(e) => changeName()}>
            {loaderButtonName && <ButtonLoader />}
            {!loaderButtonName && t('profile.buttonChangeName')}
          </button>
        </div>}
      </div>
      {/* СМЕНА ПАРОЛЯ */}
      <div>
        <div className={styles.checkbox_input_container}>
          <label>{t('profile.changePass')}</label>
          &nbsp; &nbsp;
          <input

            id="showWeekend"
            autoComplete="off"
            checked={changePassValue}
            type="checkbox"
            onChange={e => {
              setChangePassValue(!changePassValue)
            }}
          />
        </div>

        {/* старый пароль */}
        {changePassValue && <div className={styles._input_container}>
          <input
            className={styles._input}
            type="password"
            id="password"
            value={passValue}
            placeholder={t('profile.passold')}
            onChange={(e) => { setPassValue(e.target.value) }}
            required autoComplete="off" />
        </div>}
        {/* новый пароль */}
        {changePassValue && <div className={styles._input_container}>
          <input
            className={styles._input}
            type="password"
            id="password"
            value={newPass1Value}
            placeholder={t('profile.passnew1')}
            onChange={(e) => { setNewPass1Value(e.target.value) }}
            required autoComplete="off" />
        </div>}
        {changePassValue && <div className={styles._input_container}>
          <input
            className={styles._input}
            type="password"
            id="password"
            value={newPass2Value}
            placeholder={t('profile.passnew2')}
            onChange={(e) => { setNewPass2Value(e.target.value) }}
            required autoComplete="off" />
        </div>}
        {changePassValue && <div className={styles._button_container}>
          <button className={styles.profile_button}
            onClick={(e) => changePass()}>
            {loaderButtonPass && <ButtonLoader />}
            {!loaderButtonPass && t('profile.buttonChangePass')}
          </button>
        </div>}
      </div>

      <div className={styles.title}>
        <span className={styles.title_span}>{t('profile.team')}: &nbsp; &nbsp;</span>
        {team.title}
      </div>
      <div className={styles.title}>
        <span className={styles.title_span}>{t('profile.teamNumber')}: &nbsp; &nbsp;</span>
        {teamNumberValue}
      </div>
      <div className={styles.title}>
        <span className={styles.title_span}>Роль: &nbsp; &nbsp;</span>
        {userValue.isAdmin ? t('profile.admin') : unit ? unit.title : ""}
      </div>

      {!userValue.isAdmin && <div className={styles.title}>
        <span className={styles.title_span}>{t('profile.unitCode')}: &nbsp; &nbsp;</span>
        {unit ? unit.code : ""}
      </div>}




    </div>
  );
};


