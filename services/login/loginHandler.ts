// status 0 - архив, 1 актив, 2 запрос 
import { Dispatch } from 'redux';
import {
  UserItem,
  TeamItem,
  SettingsItem,
  UnitItem,
} from './../../types/types';
import {
  setUser,
  setToken,
  setTeam,
  setSettings,
  setSignedAgreement,
  setUnit,
} from './../../store/slices';

interface LoginPayload {
  login: string;
  pass: string;
  token: string;
  t: (key: string) => string;
  setMessage: (msg: string) => void;
  setMessageLogin: (msg: string) => void;
  dispatch: Dispatch;
  setStep: (step: number) => void;
  agreementIdRef: React.MutableRefObject<number>;
  agreementTextRef: React.MutableRefObject<string>;
  configureTokenAccess: (
    getToken: () => string,
    setToken: (token: string) => void
  ) => void;
  store: any;
}

export const loginHandler = async ({
  login,
  pass,
  token,
  t,
  setMessage,
  setMessageLogin,
  dispatch,
  setStep,
  agreementIdRef,
  agreementTextRef,
  configureTokenAccess,
  store,
}: LoginPayload) => {

  try {

    const res = await fetch(`api/login-api`,
      {
        method: 'post',
        headers: new Headers({
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          login: login,
          pass: pass,
        }),
      }
    );
    if (res.status !== 200) {
      const receivedData = await res.json();
      const error = receivedData.error;
      setMessageLogin(error);
      setMessageLogin(t('service.serverUnavailable') + res.status);
    } else {
      const receivedData = await res.json();
      // console.log("receivedData", receivedData)

      if (receivedData.success) {
        const user_ = receivedData.user as UserItem;
        const token_ = receivedData.token as string;
        const team_ = receivedData.team as TeamItem;
        const settings_ = receivedData.settings as SettingsItem;
        const agreementText_ = receivedData.agreementText as string;
        const signed_ = receivedData.signed as boolean;
        const agreementId_ = receivedData.agreementId as number
        const unit_ = receivedData.unit as UnitItem

        //   Обновим настройки
        dispatch(setUser(user_));
        dispatch(setToken(token_));

        configureTokenAccess(
          () => store.getState().authSlice.token, // или твой точный селектор
          (newToken: string) => dispatch(setToken(newToken))
        )

        dispatch(setTeam(team_));
        dispatch(setSettings(settings_));
        dispatch(setSignedAgreement(signed_));
        dispatch(setUnit(unit_));
        agreementIdRef.current = agreementId_;
        agreementTextRef.current = agreementText_;
        setStep(3);
      } else setMessageLogin(receivedData.message);
    }


  } catch (e: unknown) {
    let message = t('service.serverUnavailable');
    if (e instanceof Error) {
      message += e.message;
    }
    setMessage(message);
  }

}