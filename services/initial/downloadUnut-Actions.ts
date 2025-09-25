import { UnitActionItem } from './../../types/types';
import { setUnitActions } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем действия одного юнита
export const downloadUnutActions = async (
  unitId: number | undefined,
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {
  if (unitId === undefined) {
    return;
  }
  // Загружаем классификатор действий
  try {
    const res = await fetch(`api/unit-actions-api?userId=${userId}&teamId=${teamId}&unitId=${unitId}`,
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
      await ulogger.error({
        userId: userId,
        location: "services/initial/downloadUnutActions",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const downloadUnutActions = async (",
      });
    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const unitActions = receivedData.actions as UnitActionItem[]
        dispatch(setUnitActions(unitActions));
        setMessage(t('index.downloadUnutsActions'))
      }
      else setMessage(receivedData.error);
    }
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    setMessage(`${t('service.serverUnavailable')} ${error}`);
    //  logger
    await ulogger.error({
      userId: userId,
      location: "services/initial/downloadUnutActions",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const downloadUnutActions = async (",
    });
  }
}
