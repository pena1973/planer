import { UnitKPIItem } from "./../../types/types";
import { ulogger } from "./../../lib/common/universal-logger";
export const getUnitsKPI = async (
    userId: number,
    teamId: number,
    token: string,
    today: Date,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setUnitsKPIValue: (val: UnitKPIItem[]) => void,
    filter: string = "",
) => {

    try {
        const res = await fetch(`api/monitor/report-units-kpi-api?userId=${userId}&teamId=${teamId}&today=${today.toLocaleDateString('en-CA')}${filter}`,
            {
                method: 'get',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/monitor/getUnitsKPI",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const getUnitsKPI = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                setUnitsKPIValue(receivedData.unitsKPI as UnitKPIItem[]);
                setMessage(receivedData.message);
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/monitor/getUnitsKPI",
                    event: "error",
                    message: `success=false запрос api/monitor/report-units-kpi-api?userId=${userId}&teamId=${teamId}&today=${today.toLocaleDateString('en-CA')}${filter}`,
                    context: "export const getUnitsKPI = async (",
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
            location: "services/monitor/getUnitsKPI",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getUnitsKPI = async (",
        }).catch(() => { console.error("logger error") });
    }
}