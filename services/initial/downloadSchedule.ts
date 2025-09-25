import { ScheduleItem } from './../../types/types';
import { setSchedule } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем настройки расписания команды
export const downloadSchedule = async (
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {
  try {
    const res = await fetch(`api/schedule-api?userId=${userId}&teamId=${teamId}`,
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
        location: "services/initial/downloadSchedule",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const downloadSchedule = async (",
      });
    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const schedule = receivedData.schedule as ScheduleItem
        dispatch(setSchedule(schedule));
        setMessage(t('index.downloadSchedule'))
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
      location: "services/initial/downloadSchedule",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const downloadSchedule = async (",
    });
  }
}