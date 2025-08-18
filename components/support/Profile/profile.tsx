
import React, { useEffect, useState } from 'react';
import styles from "./profile.module.scss";
import { changePassword, changeName, deleteProfile } from "@/services/login/profileService";
// import { changePassword, changeName } from "@/services/login/profileService";
import { logout } from '@/lib/logout'

import { UserItem, TeamItem, UnitItem } from "@/types/types";
import { useTranslation } from 'react-i18next';
import { generateTeamNumber } from '@/lib/utils'
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import { useAppDispatch } from "@/pages/_app";

interface ProfileProps {
  setMessage: (message: string) => void,
  team: TeamItem,
  user: UserItem,
  unit: UnitItem,
  token: string
}

export const Profile: React.FC<ProfileProps> = ({
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
  const [loaderButtonDel, setLoaderButtonDel] = useState(false);

  const [nameValue, setNameValue] = useState(''); // имя юзера
  const [changePassValue, setChangePassValue] = useState(false);
  const [changeNameValue, setChangeNameValue] = useState(false);
  const [deleteProfileValue, setDeleteProfileValue] = useState(false);

  const [loginValue, setLoginValue] = useState(''); // Удаление профиля

  useEffect(() => {
    setUserValue(user)
  }, [user]);

  const deleteProfileHandler = async (login: string) => {
    setMessage("");
    setLoaderButtonDel(true)
    if (loginValue !== user.login) { 
      setLoaderButtonDel(false)
      return setMessage(t('profile.loginError')) 
    }

    const res = await deleteProfile(user.isAdmin, user.id, team.id, token, t, setMessage);
    if (res) {
      logout('/')
    }
    setLoaderButtonDel(false)
  }

  // На сервере
  const changePassHandler = async () => {
    setMessage("");
    setLoaderButtonPass(true)
    if (newPass1Value !== newPass2Value) return

    const res = await changePassword(passValue, newPass1Value, user.id, team.id, token, t, dispatch, setMessage);

    if (res) {
      setPassValue("");
      setNewPass1Value("");
      setNewPass2Value("");
    }

    setLoaderButtonPass(false)
  }

  // На сервере
  const changeNameHandler = async () => {
    setMessage("");
    setLoaderButtonName(true)

    const res = await changeName(nameValue, user.id, team.id, token, t, dispatch, setMessage);

    if (res) setNameValue("");

    setLoaderButtonName(false)
  }
  // На клиенте
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
            onClick={(e) => changeNameHandler()}>
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
            onClick={(e) => changePassHandler()}>
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

      {/* УДАЛЕНИЕ ПРОФИЛЯ */}
      <div>
        <div className={styles.checkbox_input_container}>
          <label>{t('profile.delete')}</label>
          &nbsp; &nbsp;
          <input

            id="showWeekend"
            autoComplete="off"
            checked={deleteProfileValue}
            type="checkbox"
            onChange={e => {
              setDeleteProfileValue(!deleteProfileValue)
            }}
          />
        </div>
        {deleteProfileValue && <div className={styles._input_container}>
          <input
            className={styles._input}
            type="text"
            id="login"
            value={loginValue}
            placeholder={t('profile.login')}
            onChange={(e) => { setLoginValue(e.target.value) }}
            required autoComplete="off" />
        </div>}
        {deleteProfileValue && <div className={styles._button_container}>
          <button className={styles.profile_button}
            onClick={(e) => deleteProfileHandler(loginValue)}>
            {loaderButtonDel && <ButtonLoader />}
            {!loaderButtonDel && t('profile.buttondDeleteProfile')}
          </button>
        </div>}
      </div>

    </div>
  );
};


