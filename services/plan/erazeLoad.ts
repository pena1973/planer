import { Dispatch } from "redux";
import { UnitLoadItem, TCardItem } from "./../../types/types";
import { setUnitLoads, setTCards } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const erazeLoad = async (
  load_idc: number,
  unitLoads: UnitLoadItem[],
  tCards: TCardItem[],
  token: string,
  userId: number,
  teamId: number,
  dispatch: Dispatch,
  t: (key: string) => string,
  locale: string,
  setMessage: (message: string) => void
) => {

  const erazload = unitLoads.find(load => load.idc === load_idc)
  const tCardLoads = unitLoads.filter(load => load.id_tCard === erazload?.id_tCard)
  const tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== erazload?.id_tCard)

  const index = tCards.findIndex(tCard => tCard.id === erazload?.id_tCard);

  if (erazload) {

    try {
      const res = await fetch(`/api/plan/eraze-load-plan-api`,
        {
          method: 'post',
          headers: {
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json',
             'X-Lang': locale,
          },
          body: JSON.stringify({
            erazload: erazload,
            tCardLoads: tCardLoads,
            teamId: teamId,
            userId: userId,
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
          location: "services/plan/erazeLoad",
          event: "endpoint_error",
          message: `res.status=${res.status} error=${error}`,
          context: "export const erazeLoad = async (",
        }).catch(() => { console.error("logger error") });

      } else {
        const receivedData = await res.json();

        if (receivedData.success) {
          const updatedTCard = (receivedData.tCard as TCardItem)
          const tCardLoads_ = (receivedData.unitsLoads as UnitLoadItem[])
          // обновляем лоады
          const updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
          dispatch(setUnitLoads(updatedLoads));

          // меняем карту в списке
          const _tCards = [...tCards]
          _tCards.splice(index, 1, updatedTCard);
          dispatch(setTCards(_tCards));

          // setMessage(" Успешно удалено планирование операции и все последующие зависимые планирования");
          setMessage(t("mes.erazeOperLoads"));
        } else {
          setMessage(receivedData.message);
          //  logger
          void ulogger.error({
            userId: userId,
            location: "services/plan/erazeLoad",
            event: "error",
            message: `success=false запрос /api/plan/eraze-load-plan-api`,
            context: "export const erazeLoad = async (",
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
        location: "services/plan/erazeLoad",
        event: "endpoint_error",
        message: `catch: ${error}`,
        context: "export const erazeLoad = async (",
      }).catch(() => { console.error("logger error") });
    }
  }
}