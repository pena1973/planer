import { Dispatch } from "redux";
import { UnitItem, UnitLoadItem, StatusEnum } from "./../../types/types";
import { setUnitLoads } from "./../../store/slices";

export const moveLoad = async (

    load: UnitLoadItem,
    unit: UnitItem,
    date: string,
    timeStart: number,
    timeFinish: number,
    unitLoads: UnitLoadItem[],
    tCardPreparedId: number,
    token: string,
    userId: number,
    teamId: number,
    today: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
) => {

    const tCardLoads = unitLoads.filter(load => load.id_tCard === tCardPreparedId)
    const tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== tCardPreparedId)
    //  перетаскивать лоады можем только на этапе prepared
    if (load) {
        if (load.status === StatusEnum.prepared) {
            // ЗАПРОС НА СЕРВЕР сдвигаем планирование с учетом прибитого лоада
            // проверяем согласованность предыдущих и перепланируем последующие
            try {
                const res = await fetch(`/api/plan/pre-moveload-api`,
                    {
                        method: 'post',
                        headers: new Headers({
                            'Authorization': 'Basic ' + token,
                            'Content-Type': 'application/json'
                        }),
                        body: JSON.stringify({
                            pinnedLoad: load,
                            tCardLoads: tCardLoads,
                            unit: unit,
                            date: date,
                            timeStart: timeStart,
                            timeFinish: timeFinish,
                            today: today,
                            userId: userId,
                            teamId: teamId,
                        }),
                    }
                );

                if (res.status !== 200) {
                    const receivedData = await res.json();
                    setMessage(receivedData.error);
                } else {
                    const receivedData = await res.json();
                    if (receivedData.success) {
                        const tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
                        const updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
                        dispatch(setUnitLoads(updatedLoads));
                        setMessage(" Успешно изменено предварительное планирование операции и все последующие зависимые планирования");
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
}