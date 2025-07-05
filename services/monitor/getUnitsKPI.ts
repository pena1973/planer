import { UnitKPIItem } from "@/types/types";

export const getUnitsKPI = async (
    userId: number,
    teamId: number,
    token: string,
    today: Date,  
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setUnitsKPIValue: (val: UnitKPIItem[]) => void,
    filter: string = "",
) => {

    try {
        const res = await fetch(`api/report-units-kpi-api?userId=${userId}&teamId=${teamId}&today=${today.toLocaleDateString('en-CA')}${filter}`,
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
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                setUnitsKPIValue(receivedData.unitsKPI as UnitKPIItem[]);
                setMessage(receivedData.message);
            }
        }
    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
}