import { SupportMailItem } from "./../../types/types";

import { ulogger } from "./../../lib/common/universal-logger";

export const getSupportMails = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setSupportMessagesValue: (messages: SupportMailItem[]) => void
) => {

    try {
        const res = await fetch(`api/support-api?teamId=${teamId}&userId=${userId}`, {
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
                location: "services/suport/getSupportMails",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const getSupportMails = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            setMessage(receivedData.message);
            if (receivedData.success) {
                const messages = receivedData.supportMessages as SupportMailItem[];
                setSupportMessagesValue(messages);
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/suport/getSupportMails",
                    event: "error",
                    message: `success=false запрос api/support-api?teamId=${teamId}&userId=${userId}`,
                    context: "export const getSupportMails = async (",
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
            location: "services/suport/getSupportMails",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getSupportMails = async (",
        }).catch(() => { console.error("logger error") });
    }

};