import { TCardItem, TCardOperationItem, UnitLoadItem } from "./../../types/types";
import { ulogger } from "./../../lib/common/universal-logger";

export const openOperation = async (
  load: UnitLoadItem,
  id_oper: number,
  id_tCard: number,
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  setCurrentTCard: (tCard: TCardItem) => void,
  setCurrentOper: (op: TCardOperationItem) => void,
  setCurrentLoad: (load: UnitLoadItem) => void
) => {

  try {
    const res = await fetch(`api/tCard/tcard-api?userId=${userId}&teamId=${teamId}&tCardId=${id_tCard}`,
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
        location: "services/monitor/openOperation",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const openOperation = async (",
      }).catch(() => { console.error("logger error") });
    } else {
      const receivedData = await res.json();
      setMessage(receivedData.message);
      if (receivedData.success) {
        const tCard = receivedData.tCard as TCardItem
        setCurrentTCard(tCard);
        const oper = tCard.tCardOperations?.find((oper) => oper.id === id_oper);
        if (!oper) return
        setCurrentOper(oper as TCardOperationItem);
        setCurrentLoad(load as UnitLoadItem);
        setMessage(receivedData.message);
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/monitor/openOperation",
          event: "error",
          message: `success=false запрос api/tCard/tcard-api?userId=${userId}&teamId=${teamId}&tCardId=${id_tCard}`,
          context: "export const openOperation = async (",
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
      location: "services/monitor/openOperation",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const openOperation = async (",
    }).catch(() => { console.error("logger error") });
  }
}