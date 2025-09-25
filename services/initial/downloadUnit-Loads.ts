import { UnitLoadItem } from './../../types/types';
import { setUnitLoads } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем лоады одного юнита
export const downloadUnitLoads = async (
    unitId: number | undefined,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {

    try {
        const res = await fetch(`/api/loads-api?userId=${userId}&teamId=${teamId}&unitId=${unitId}`,
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
                location: "services/initial/downloadUnitLoads",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadUnitLoads = async (",
            });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const unitsLoads = (receivedData.unitsLoads as UnitLoadItem[])
                dispatch(setUnitLoads(unitsLoads));
                setMessage(t('index.downloadLoads'))
            }
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
            location: "services/initial/downloadUnitLoads",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadUnitLoads = async (",
        });
    }
};
