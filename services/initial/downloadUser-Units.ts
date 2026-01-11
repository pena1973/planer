import { UserUnitItem } from './../../types/types';
import { setUserUnits } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем классификатор юнитов
export const downloadUserUnits = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {

      try {
           const res = await fetch(`api/units/users-units-api?userId=${userId}&teamId=${teamId}&withoutAdmin=${true}`,
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
                   location: "services/initial/downloadUser-Units",
                   event: "endpoint_error",
                   message: `res.status=${res.status} error=${error}`,
                   context: "export const getUsersUnits = async (",
               }).catch(() => { console.error("logger error") });
           } else {
               const receivedData = await res.json();
               if (receivedData.success) {
                   const users_units_ = receivedData.users_units as UserUnitItem[];
                   dispatch(setUserUnits(users_units_));
                   
               } else {
                   setMessage(receivedData.message);
                   //  logger
                   void ulogger.error({
                       userId: userId,
                       location: "services/initial/downloadUser-Units",
                       event: "error",
                       message: `success=false запрос api/users-units-api?userId=${userId}&teamId=${teamId}&withoutAdmin=${true}`,
                       context: "export const getUsersUnits = async (",
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
               location: "services/initial/downloadUser-Units",
               event: "endpoint_error",
               message: `catch: ${error}`,
               context: "export const getUsersUnits = async (",
           }).catch(() => { console.error("logger error") });
       }
}