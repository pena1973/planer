import { UnitLoadItem } from '@/types/types';
import { setUnitLoads } from '@/store/slices';
import { Dispatch } from 'redux';

export const downloadLoads = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {

    try {
        const res = await fetch(`/api/loads-api?userId=${userId}&teamId=${teamId}`,
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
            setMessage(t('service.serverUnavailable') + error);
        } else {
            const receivedData = await res.json();
            // console.log("receivedData", receivedData)        
            if (receivedData.success) {
                //  массив юнитов с загрузками
                const unitsLoads = (receivedData.unitsLoads as UnitLoadItem[])

                dispatch(setUnitLoads(unitsLoads));
                // setMessage("Загружены планы и история ")
                setMessage(t('index.downloadLoads'))
            }
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }


};
