import { StatusEnum } from "./../../../types/types";
import { ulogger } from "./../../../lib/common/universal-logger";

export const setOperationStatus = async (
    status: StatusEnum,
    operId: number,
    tCardId: number,
    version: number,
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
    ) => void,

) => {


    try {
        const res = await fetch(`api/tcard-oper-status-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),
                body: JSON.stringify({
                    tCardId: tCardId,
                    operId: operId,
                    version: version,
                    status: status,
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
                location: "services/monitor/unitProcess/setOperationStatus",
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
                const operLoadsIds = receivedData.operLoadsIds as number[]
                //   Обновим статус лоадов
                setStatusLoadsHandler(tCardStatus, status, operLoadsIds, operId, tCardId);
                setMessage(receivedData.message);
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/monitor/unitProcess/setOperationStatus",
                    event: "error",
                    message: `success=false запрос api/tcard-oper-status-api`,
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
            location: "services/monitor/unitProcess/setOperationStatus",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const setOperStatus = async (",
        }).catch(() => { console.error("logger error") });
    }
}
