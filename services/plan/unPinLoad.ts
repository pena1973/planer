
import { Dispatch } from "redux";
import { UnitLoadItem } from "./../../types/types";
import { setUnitLoads } from "./../../store/slices";

export const unPinLoad = async (
    tCardId: number,
    operId: number,
    unitLoads: UnitLoadItem[],
    today: string,
    version: number, // версия для проверки на сервере
    token: string,
    userId: number,
    teamId: number,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (message: string) => void,
) => {


    //  последующее перепланирование
    const tCardLoads = unitLoads.filter(load => load.id_tCard === tCardId)
    const tCardLoadsWithout = unitLoads.filter(load => load.id_tCard !== tCardId)
    //  перетаскивать лоады можем только на этапе prepared

    // ЗАПРОС НА СЕРВЕР сдвигаем планирование с учетом прибитого лоада
    // проверяем согласованность предыдущих и перепланируем последующие
    try {
        const res = await fetch(`/api/pre-unpinload-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    tCardId: tCardId,
                    operId: operId,
                    tCardLoads: tCardLoads,
                    today: today
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
