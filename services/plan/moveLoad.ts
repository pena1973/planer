import { Dispatch } from "redux";
import { UnitItem, UnitLoadItem, StatusEnum } from "./../../types/types";
import { setUnitLoads } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

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
    if (load && load.status === StatusEnum.prepared) {
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
                const error = receivedData.error;
                setMessage(`${t('service.serverUnavailable')} ${error}`);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/plan/moveLoad",
                    event: "endpoint_error",
                    message: `res.status=${res.status} error=${error}`,
                    context: "export const moveLoad = async (",
                }).catch(() => { console.error("logger error") });
            } else {
                const receivedData = await res.json();
                if (receivedData.success) {
                    const tCardLoads_ = (receivedData.tCardLoads as UnitLoadItem[])
                    const updatedLoads = [...tCardLoadsWithout, ...tCardLoads_]
                    dispatch(setUnitLoads(updatedLoads));
                    // setMessage(" Успешно изменено предварительное планирование операции и все последующие зависимые планирования");
                    setMessage(t("changeOperLoads"));
                } else {
                    setMessage(receivedData.message);
                    //  logger
                    void ulogger.error({
                        userId: userId,
                        location: "services/plan/moveLoad",
                        event: "error",
                        message: `success=false запрос /api/plan/pre-moveload-api`,
                        context: "export const moveLoad = async (",
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
                location: "services/plan/moveLoad",
                event: "endpoint_error",
                message: `catch: ${error}`,
                context: "export const moveLoad = async (",
            }).catch(() => { console.error("logger error") });
        }

    }

}