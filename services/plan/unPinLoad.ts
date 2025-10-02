
import { Dispatch } from "redux";
import { UnitLoadItem } from "./../../types/types";
import { setUnitLoads } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

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
        const res = await fetch(`/api/plan/pre-unpinload-api`,
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
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/plan/unPinLoad",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const unPinLoad = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
                const updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
                dispatch(setUnitLoads(updatedLoads));
                // setMessage(" Успешно изменено предварительное планирование операции и все последующие зависимые планирования");
                setMessage(t("mes.prePlanCganged"));

            } else {
                setMessage(receivedData.message);
                void ulogger.error({
                    userId: userId,
                    location: "services/plan/unPinLoad",
                    event: "error",
                    message: `success=false запрос /api/plan/pre-unpinload-api`,
                    context: "export const unPinLoad = async (",
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
            location: "services/plan/unPinLoad",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const unPinLoad = async (",
        }).catch(() => { console.error("logger error") });
    }
}
