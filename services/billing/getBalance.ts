import { ulogger } from "./../../lib/common/universal-logger";

export const getBalance = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setBalance: (val: number) => void,) => {

    try {

        const res = await fetch(`api/billing/balance-api?userId=${userId}&teamId=${teamId}`,
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
                location: "services/billing/getBalance",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const getBalance = async (",
            }).catch(() => { console.error("logger error") });

        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const balance = receivedData.balance as number
                setBalance(balance);
                setMessage("");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/billing/getBalance",
                    event: "error",
                    message: `success=false запрос api/billing/balance-api?userId=${userId}&teamId=${teamId}`,
                    context: "export const getBalance = async (",
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
            location: "services/billing/getBalance",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getBalance = async (",
        }).catch(() => { console.error("logger error") });
    }
};