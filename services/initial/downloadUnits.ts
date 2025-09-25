import { UnitItem } from './../../types/types';
import { setUnits } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем классификатор юнитов
export const downloadUnits = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {

    try {
        const res = await fetch(`api/units-api?userId=${userId}&teamId=${teamId}`,
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
                location: "services/initial/downloadUnits",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadUnits = async (",
            });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const units_ = receivedData.units as UnitItem[]
                units_.sort((a, b) => {
                    const idA = a.id ?? 0; // Если id a не существует, считаем его 0
                    const idB = b.id ?? 0; // Если id b не существует, считаем его 0          
                    return idA - idB; // Сравниваем id
                });
                dispatch(setUnits(units_));
                setMessage(t('index.downloadUnits'))
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
            location: "services/initial/downloadUnits",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadUnits = async (",
        });
    }
}