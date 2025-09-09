import { getCurrentDateInDate, getTimeZoneDateFromDateString } from "./../../lib/timezone"
// прогноз оплаты на текущий месяц по главной команде с учетом времени активности
export const getForecast = async (
    timesone: string,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setForecast: (val: number) => void,
    setVAT: (val: number) => void,
) => {

    try {
        // teamId, month, base, disc 
        const today = getCurrentDateInDate(timesone);
        const year = today.getFullYear();
        const month = today.getUTCMonth() + 1;
        const base = 100; // перенести в генеральные настройки
        const disc = 20;  // перенести в генеральные настройки

        const res = await fetch(`api/billing/forecast-api?userId=${userId}&teamId=${teamId}&month=${month}&base=${base}&disc=${disc}&year=${year}`,
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
                const forecast = receivedData.forecast as number
                setForecast(forecast);
                const VAT = receivedData.VAT as number
                setVAT(VAT);
            } else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }


};