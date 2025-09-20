import { Dispatch } from "redux";
import { UnitLoadItem, StatusEnum } from "./../../types/types";
import { setUnitLoads } from "./../../store/slices";

export const preFullCardPlan = async (
    tCardId:number,    
    unitLoads: UnitLoadItem[],    
    token: string,
    userId: number,
    teamId: number,
    today: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
) => {
   const tCardLoadsPlaned = unitLoads.filter(load => load.id_tCard === tCardId && load.status !== StatusEnum.prepared)
    const tCardLoadsWithout = unitLoads.filter(lo => lo.id_tCard !== tCardId)

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
        setMessage(error);
      } else {
        const receivedData = await res.json();

        const tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
        const updatedLoads = [...tCardLoadsWithout, ...tCardLoadsPlaned, ...tCardLoads_]
        dispatch(setUnitLoads(updatedLoads));
        if (receivedData.success) {
          setMessage("Карта успешно предварительно запланирована НО НЕЗАПИСАНА! Если все в порядке ЗАПИШИ!");
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