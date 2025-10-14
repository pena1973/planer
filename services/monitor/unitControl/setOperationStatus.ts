import { StatusEnum, UnitLoadItem, TCardOperationItem, TCardItem } from "./../../../types/types";
import { ulogger } from "./../../../lib/common/universal-logger";

export const setOperationStatus = async (
  status: StatusEnum,
  currentOper: TCardOperationItem,
  currentLoad: UnitLoadItem,
  currentTCard: TCardItem,
  performedLoads: UnitLoadItem[],
  token: string,
  teamId: number,
  userId: number,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  setStatusLoadsHandler: (
    tCardStatus: StatusEnum,
    newStatus: StatusEnum,
    loadsIds: number[],
    operId: number,
    tCardId: number
  ) => void,

) => {

  const operloadsIds = performedLoads
    .filter(lo => lo.id_oper === currentOper.id && lo.version === currentLoad.version && lo.status === StatusEnum.performed)
    .map(load => load.id as number); //  все лоады операции

  try {
    const res = await fetch(`api/tCard/tcard-oper-status-api`,
      {
        method: 'post',
        headers: new Headers({
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json',
          "X-Lang": locale,
        }),
        body: JSON.stringify({
          tCardId: currentLoad.id_tCard,
          operId: currentOper.id,
          status: status,
          teamId: teamId,
          userId: userId,
          version: currentLoad.version,
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
        location: "services/monitor/unitControl/setOperationStatus",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const setOperationStatus = async (",
      }).catch(() => { console.error("logger error") });
    } else {
      const receivedData = await res.json();
      setMessage(receivedData.message);
      if (receivedData.success) {
        // проверили и вернули общий статус карты
        const tCardStatus = receivedData.tCardStatus as StatusEnum
        //   Обновим статус лоадов
        setStatusLoadsHandler(tCardStatus, status, operloadsIds, Number(currentOper.id), currentTCard.id);
        setMessage(receivedData.message);
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/monitor/unitControl/setOperationStatus",
          event: "error",
          message: `success=false запрос api/tCard/tcard-oper-status-api`,
          context: "export const setOperationStatus = async (",
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
      location: "services/monitor/unitControl/setOperationStatus",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const setOperationStatus = async (",
    }).catch(() => { console.error("logger error") });
  }
}