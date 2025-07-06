import { Dispatch } from "redux";
import { UnitLoadItem, TCardItem } from "./../../types/types";
import { setUnitLoads, setTCards } from "./../../store/slices";

export const erazeLoad = async (
  load_idc: number,
  unitLoads: UnitLoadItem[],
  tCards: TCardItem[],
  token: string,
  userId: number,
  teamId: number,
  dispatch: Dispatch,
  t: (key: string) => string,
  setMessage: (message: string) => void
) => {

  const erazload = unitLoads.find(load => load.idc === load_idc)
  const tCardLoads = unitLoads.filter(load => load.id_tCard === erazload?.id_tCard)
  const tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== erazload?.id_tCard)

  const index = tCards.findIndex(tCard => tCard.id === erazload?.id_tCard);

  if (erazload) {

    try {
      const res = await fetch(`/api/eraze-load-plan-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            erazload: erazload,
            tCardLoads: tCardLoads,
            today: new Date().toLocaleDateString("en-CA"),
            teamId: teamId,
            userId: userId,
          }),
        }
      );

      if (res.status !== 200) {
        const receivedData = await res.json();
        setMessage(receivedData.error);

      } else {
        const receivedData = await res.json();
        const updatedTCard = (receivedData.tCard as TCardItem)
        const tCardLoads_ = (receivedData.unitsLoads as UnitLoadItem[])
        // обновляем лоады
        const updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
        dispatch(setUnitLoads(updatedLoads));
        // меняем карту в списке
        const _tCards = [...tCards]
        _tCards.splice(index, 1, updatedTCard);
        dispatch(setTCards(_tCards));
        if (receivedData.success) {
          setMessage(" Успешно удалено планирование операции и все последующие зависимые планирования");
        } else {
          setMessage(receivedData.message);
        }
      }
    } catch (e: unknown) {
      let message = t('service.serverUnavailable');
      if (e instanceof Error) {
        message += e.message;
      }
      setMessage(message);
    }
  }
}