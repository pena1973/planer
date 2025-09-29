import { UnitExceptionItem } from './../../types/types';
import { setUnitExceptions } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем исключения одного юнита
export const downloadUnutExceptions = async (
    unitId: number | undefined,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {

    if (unitId === undefined) {
        return;
    }
    // Загружаем классификатор действий
    try {
        const res = await fetch(`api/exceptions-api?userId=${userId}&teamId=${teamId}&unitId=${unitId}`,
            {
                method: 'get',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
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
                location: "services/initial/downloadUnutExceptions",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadUnutExceptions = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const exceptions = receivedData.exceptions as UnitExceptionItem[]
                dispatch(setUnitExceptions(exceptions));
                setMessage(t('index.downloadUnutsExceptions'))
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/initial/downloadUnutExceptions",
                    event: "error",
                    message: `success=false запрос api/exceptions-api?userId=${userId}&teamId=${teamId}&unitId=${unitId}`,
                    context: "export const downloadUnutExceptions = async (",
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
            location: "services/initial/downloadUnutExceptions",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadUnutExceptions = async (",
        }).catch(() => { console.error("logger error") });
    }
}