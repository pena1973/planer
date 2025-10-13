import { SettingsItem } from './../../types/types';
import { setSettings } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем настройки команды
export const downloadSettings = async (
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {
  try {
    const res = await fetch(`api/settings-api?userId=${userId}&teamId=${teamId}`,
      {
        method: 'get',
        headers: new Headers({
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json',
          "X-Lang": locale,
        }),
      }
    );
    if (res.status !== 200) {
      const receivedData = await res.json();
      const error = receivedData.error;
      setMessage(`${t('service.serverUnavailable')} ${error}`);
      //  logger
      void ulogger.error({
        userId: userId,
        location: "services/initial/downloadSettings",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const downloadSettings = async (",
      }).catch(() => { console.error("logger error") });
    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const settings = receivedData.schedule as SettingsItem
        dispatch(setSettings(settings));
        setMessage(t('index.downloadSettings'))
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/initial/downloadSettings",
          event: "error",
          message: `success=false запрос api/settings-api?userId=${userId}&teamId=${teamId}`,
          context: "export const downloadSettings = async (",
        }).catch(() => { console.error("logger error") });
      }
    }

  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    setMessage(`${t('service.serverUnavailable')} ${error}`);
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/initial/downloadSettings",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const downloadSettings = async (",
    }).catch(() => { console.error("logger error") });
  }
}
