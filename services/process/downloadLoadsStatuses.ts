import { StatusEnum, UnitLoadItem } from './../../types/types';
import { setUnitLoads } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

export const downloadLoadsStatuses = async (
    userId: number,
    teamId: number,
    token: string,
    unitsLoads: UnitLoadItem[],
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {

    try {
        const res = await fetch(`/api/loads-statuses-api?userId=${userId}&teamId=${teamId}`,
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
                location: "services/process/downloadLoadsStatuses",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadLoadsStatuses = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            // console.log("receivedData", receivedData)        
            if (receivedData.success) {
                //  массив юнитов с загрузками
                const unitsLoadsStatuses = (receivedData.unitsLoadStatuses as { idc_load: number, status: StatusEnum }[])
                const updatedUnitsLoads = unitsLoads.map(load => {
                    const status = unitsLoadsStatuses.find(st => Number(st.idc_load) === Number(load.idc))?.status;
                    if (status && status !== load.status) { return { ...load, status: status } }
                    else return load;
                })
                // косьтыль чтобы не диспатчить пустой массив
                if (updatedUnitsLoads.length > 0) {
                    dispatch(setUnitLoads(updatedUnitsLoads));
                }
                // setMessage("Загружены планы и история ")
                setMessage(t('index.downloadLoads'))
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/process/downloadLoadsStatuses",
                    event: "error",
                    message: `success=false запрос /api/loads-statuses-api?userId=${userId}&teamId=${teamId}`,
                    context: "export const downloadLoadsStatuses = async (",
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
            location: "services/process/downloadLoadsStatuses",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadLoadsStatuses = async (",
        }).catch(() => { console.error("logger error") });
    }


};
