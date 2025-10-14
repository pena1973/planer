import { StatusEnum, UnitLoadItem } from "./../../types/types";
import { ulogger } from "./../../lib/common/universal-logger";

export const setOperStatus = async (
    currentLoad: UnitLoadItem,
    outerLoads: UnitLoadItem[],
    status: StatusEnum,
    teamId: number,
    userId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setStatusLoadsHandler: (
        tCardStatus: StatusEnum,
        newStatus: StatusEnum,
        loadsIds: number[],
        operId: number,
        tCardId: number
    ) => void
) => {

    const operloadsIds = outerLoads
        .filter(lo => lo.id_oper === currentLoad.id_oper && lo.version === currentLoad.version && lo.status === StatusEnum.planed)
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
                    operId: currentLoad.id_oper,
                    version: currentLoad.version,
                    loadsIds: operloadsIds,
                    status: status,
                    teamId: teamId,
                    userId: userId
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
                location: "services/monitor/setOperStatus",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const setOperStatus = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            setMessage(receivedData.message);

            if (receivedData.success) {
                // проверили и вернули общий статус карты
                const tCardStatus = receivedData.tCardStatus as StatusEnum
                //   Обновим статус лоадов
                setStatusLoadsHandler(tCardStatus, status, operloadsIds, currentLoad.id_oper, currentLoad.id_tCard);
                setMessage(receivedData.message);
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/monitor/setOperStatus",
                    event: "error",
                    message: `success=false запрос api/tCard/tcard-oper-status-api`,
                    context: "export const setOperStatus = async (",
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
            location: "services/monitor/setOperStatus",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const setOperStatus = async (",
        }).catch(() => { console.error("logger error") });
    }

}