// services/admin/createUsage.ts
import { UsageItem } from "@/types/service-types";
import { ulogger } from "./../../lib/common/universal-logger";

export const createUsage = async (
    userId: number,
    teamId: number,
    date: string,
    amount: number,
    direction: string,
    coment: string,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setUsage: (val: UsageItem[]) => void,

) => {

    try {

        const res = await fetch(`api/billing/usage-api`,
            {
                method: 'post',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    date: date,
                    amount: amount,
                    direction: direction,
                    coment: coment,
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
                location: "services/admin/createUsage.ts",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const createUsage = async (",
            }).catch(() => { console.error("logger error") });

        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const usage = receivedData.usage as UsageItem[];
                setUsage(usage);
                setMessage("");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/admin/createUsage.ts",
                    event: "error",
                    message: `success=false запрос api/billing/balance-api?userId=${userId}&teamId=${teamId}`,
                    context: "export const createUsage = async (",
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
            location: "services/admin/createUsage.ts",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const createUsage = async (",
        }).catch(() => { console.error("logger error") });
    }
};