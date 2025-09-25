import { UnitExceptionItem } from './../../types/types';
import { setUnitExceptions } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем исключения юнита
export const downloadUnutsExceptions = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {

    try {
        const res = await fetch(`api/exceptions-api?userId=${userId}&teamId=${teamId}`,
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
            await ulogger.error({
                userId: userId,
                location: "services/initial/downloadUnutsExceptions",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadUnutsExceptions = async (",
            });

        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const exceptions = receivedData.exceptions as UnitExceptionItem[]
                dispatch(setUnitExceptions(exceptions)); 
                setMessage(t('index.downloadUnutsExceptions'))
            }
            else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let error = "";
        if (e instanceof Error) {
            error = e.message;
        }
        setMessage(`${t('service.serverUnavailable')} ${error}`);
        //  logger
        await ulogger.error({
            userId: userId,
            location: "services/initial/downloadUnutsExceptions",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadUnutsExceptions = async (",
        });
    }
}