import { SupportMailItem } from "./../../types/types";

import { ulogger } from "./../../lib/common/universal-logger";

export const getSupportMailsAdmin = async (
    userId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setSupportMailsValue: (messages: SupportMailItem[]) => void
) => {

    try {
        const res = await fetch(`api/admin/support-admin-api`, {
            method: 'get',
            headers: new Headers({
                'Authorization': 'Basic ' + token,
                'Content-Type': 'application/json',
                "X-Lang": locale,
            }),
        });
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/admin/getSupportMailsAdmin",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const getSupportMailsAdmin = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            setMessage(receivedData.message);
            if (receivedData.success) {
                const mails = receivedData.supportMessages as SupportMailItem[];
                setSupportMailsValue(mails);
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/admin/getSupportMailsAdmin",
                    event: "error",
                    message: `success=false запрос api/admin/support-admin-api`,
                    context: "export const getSupportMailsAdmin = async (",
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
            location: "services/admin/getSupportMailsAdmin",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getSupportMailsAdmin = async (",
        }).catch(() => { console.error("logger error") });
    }

};