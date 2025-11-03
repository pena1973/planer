import { Dispatch } from "redux";
import { UnitLoadItem, StatusEnum } from "./../../types/types";
import { setUnitLoads } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const preFullCardPlan = async (
  tCardId: number,
  unitLoads: UnitLoadItem[],
  token: string,
  userId: number,
  teamId: number,
  today: string,
  dispatch: Dispatch,
  t: (key: string) => string,
  setMessage: (msg: string) => void,
) => {
  const tCardLoadsPlaned = unitLoads.filter(load => Number(load.id_tCard) === tCardId && load.status !== StatusEnum.prepared)
  const tCardLoadsWithout = unitLoads.filter(lo => Number(lo.id_tCard) !== tCardId)

  try {
    const res = await fetch(`/api/plan/pre-fullcardplan-api?userId=${userId}&teamId=${teamId}&tCardId=${tCardId}&today=${today}`,
      {
        method: 'get',
        headers: new Headers({
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json'
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
        location: "services/plan/preFullCardPlan",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const preFullCardPlan = async (",
      }).catch(() => { console.error("logger error") });
    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
        const updatedLoads = [...tCardLoadsWithout, ...tCardLoadsPlaned, ...tCardLoads_]
        dispatch(setUnitLoads(updatedLoads));
        // setMessage("Карта успешно предварительно запланирована НО НЕЗАПИСАНА! Если все в порядке ЗАПИШИ!");
        setMessage(t("mes.tCardPlaned"));
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/plan/preFullCardPlan",
          event: "error",
          message: `success=false запрос /api/plan/pre-fullcardplan-api?userId=${userId}&teamId=${teamId}&tCardId=${tCardId}&today=${today}`,
          context: "export const preFullCardPlan = async (",
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
      location: "services/plan/preFullCardPlan",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const preFullCardPlan = async (",
    }).catch(() => { console.error("logger error") });
  }

}