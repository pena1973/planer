import { LeadItem } from "./../../types/leads-types";

import { ulogger } from "./../../lib/common/universal-logger";

export const getLeads = async (
    userId: number,    
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setLeadsValue: (messages: LeadItem[]) => void
) => {

    try {
        const res = await fetch(`api/landing/get-lead-api?userId=${userId}`, {
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
                location: "services/landing/getLeads",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const getLeads = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            setMessage(receivedData.message);
            if (receivedData.success) {
                const leads = receivedData.leads as LeadItem[];
                setLeadsValue(leads);
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/landing/getLeads",
                    event: "error",
                    message: `success=false запрос api/landing/get-lead-api?userId=${userId}`,
                    context: "export const getLeads = async (",
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
            location: "services/landing/getLeads",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getLeads = async (",
        }).catch(() => { console.error("logger error") });
    }

};