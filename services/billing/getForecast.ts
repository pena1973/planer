// прогноз оплаты на текущий месяц по главной команде с учетом времени активности
export const getForecast = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setForecast: (val: number) => void,) => {

    try {
        // teamId, month, base, disc 
        
        const year = new Date().getFullYear();
        const month = new Date().getUTCMonth() + 1;
        const base = 100; // перенести в генеральные настройки
        const disc = 20;  // перенести в генеральные настройки

        const res = await fetch(`api/invoices/forecast-api?userId=${userId}&teamId=${teamId}&month=${month}&base=${base}&disc=${disc}&year=${year}`,
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