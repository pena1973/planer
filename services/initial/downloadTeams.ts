import { TeamItem } from './../../types/types';
import { setTeams } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем классификатор действий
export const downloadTeams = async (
  userId: number,  
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {

  try {
    const res = await fetch(`api/admin/teams-api?userId=${userId}`,
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
        location: "services/initial/downloadTeams",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const downloadTeams = async (",
      }).catch(() => { console.error("logger error") });

    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const teams = receivedData.teams as TeamItem[]
        dispatch(setTeams(teams));
        setMessage(t('index.downloadTeams'))
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/initial/downloadTeams",
          event: "error",
          message: `success=false запрос api/catalogs/actions-api?userId=${userId}`,
          context: "export const downloadTeams = async (",
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
      location: "services/initial/downloadTeams",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const downloadTeams = async (",
    }).catch(() => { console.error("logger error") });
  }
}