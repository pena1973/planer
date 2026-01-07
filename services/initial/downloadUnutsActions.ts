import { UnitActionItem } from './../../types/types';
import { setUnitActions } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем действия юнитов
export const downloadUnutsActions = async (
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {

  try {
    const res = await fetch(`api/units/unit-actions-api?userId=${userId}&teamId=${teamId}`,
      {
        method: 'get',
        headers: {
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json',
          "X-Lang": locale,
        },
      }
    );
    if (res.status !== 200) {
      const receivedData = await res.json();
      const error = receivedData.error;
      setMessage(`${t('service.serverUnavailable')} ${error}`);
      //  logger
      void ulogger.error({
        userId: userId,
        location: "services/initial/downloadUnutsActions",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const downloadUnutsActions = async (",
      }).catch(() => { console.error("logger error") });
    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const unitActions = receivedData.actions as UnitActionItem[]
        dispatch(setUnitActions(unitActions));        
        setMessage(t('index.downloadUnutsActions'))
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/initial/downloadUnutsActions",
          event: "error",
          message: `success=false запрос api/catalogs/unit-actions-api?userId=${userId}&teamId=${teamId}`,
          context: "export const downloadUnutsActions = async (",
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
      location: "services/initial/downloadUnutsActions",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const downloadUnutsActions = async (",
    }).catch(() => { console.error("logger error") });
  }
}
