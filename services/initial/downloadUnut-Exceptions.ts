import { UnitExceptionItem } from './../../types/types';
import { setUnitExceptions } from './../../store/slices';
import { Dispatch } from 'redux';

export const downloadUnutExceptions = async (
    unitId: number | undefined,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
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
                    'Content-Type': 'application/json'
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(error);
            //  console.log(t('service.serverUnavailable') + res.status);
            setMessage(t('service.serverUnavailable') + error);

        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const exceptions = receivedData.exceptions as UnitExceptionItem[]
                dispatch(setUnitExceptions(exceptions)); // Это ме надо?
                // setMessage("Загружены исключения юнитов")
                setMessage(t('index.downloadUnutsExceptions'))
            }
            else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }


}