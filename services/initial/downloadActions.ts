import { ActionItem } from './../../types/types';
import { setActions } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем классификатор действий
export const downloadActions = async (
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {

  try {
    const res = await fetch(`api/catalogs/actions-api?userId=${userId}&teamId=${teamId}`,
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
        location: "services/initial/downloadActions",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const downloadActions = async (",
      }).catch(() => { console.error("logger error") });

    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const actions_ = receivedData.actions as ActionItem[]
        dispatch(setActions(actions_));
        setMessage(t('index.downloadActions'))
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/initial/downloadActions",
          event: "error",
          message: `success=false запрос api/catalogs/actions-api?userId=${userId}&teamId=${teamId}`,
          context: "export const downloadActions = async (",
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
      location: "services/initial/downloadActions",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const downloadActions = async (",
    }).catch(() => { console.error("logger error") });
  }
}