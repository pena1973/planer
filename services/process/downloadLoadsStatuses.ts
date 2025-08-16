import { StatusEnum, UnitLoadItem } from './../../types/types';
import { setUnitLoads } from './../../store/slices';
import { Dispatch } from 'redux';

export const downloadLoadsStatuses = async (
    userId: number,
    teamId: number,
    token: string,
    unitsLoads: UnitLoadItem[],
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {

    try {
        const res = await fetch(`/api/loads-statuses-api?userId=${userId}&teamId=${teamId}`,
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
                const unitsLoadsStatuses = (receivedData.unitsLoadStatuses as { idc_load: number, status: StatusEnum }[])

                const updatedUnitsLoads = unitsLoads.map(load => {
                    const status = unitsLoadsStatuses.find(st => st.idc_load === load.idc)?.status;
                    if (status && status !== load.status) { return { ...load, status: status } }
                    else return load;
                })
                //   const pr =  updatedUnitsLoads.filter(load => load.status === StatusEnum.prepared)
                //   console.log("pr", pr)
                dispatch(setUnitLoads(updatedUnitsLoads));
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
