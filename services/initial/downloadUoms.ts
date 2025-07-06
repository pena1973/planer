import { UOMItem } from './../../types/types';
import { setUOMs } from './../../store/slices';
import { Dispatch } from 'redux';

export const downloadUoms = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch) => {
    try {
        const res = await fetch(`api/uoms-api?userId=${userId}&teamId=${teamId}`,
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
                const uoms_ = receivedData.uoms as UOMItem[]
                dispatch(setUOMs(uoms_));
                // setMessage("Загружены единицы измерения")
                setMessage(t('index.downloadUoms'))
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