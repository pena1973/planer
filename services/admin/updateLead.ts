
import { LeadItem, LeadSource, LeadStatus } from "./../../types/leads-types";

import { ulogger } from "./../../lib/common/universal-logger";

export const updateLead = async (
    userId: number,
    leadId: number,
    status: LeadStatus | null,
    notes: string | null,
    leads: LeadItem[],
    setleads: (val: LeadItem[]) => void,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,

) => {

    try {
        const res = await fetch(`api/admin/update-lead-api`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    leadId: leadId,
                    status: status,
                    notes: notes
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
                location: "services/admin/updateLead",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const updateLead = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {

                const leads_ = leads.map(lead => {
                    if (lead.id === leadId) {
                        const lead_ = (status !== null) ? { ...lead, status: status } : lead;
                        const lead__ = (notes !== null) ? { ...lead_, notes: notes } : lead_;
                        return lead__;
                    }
                    return lead;
                })
                setleads(leads_);
                setMessage("Успешно обработан лид");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/admin/updateLead",
                    event: "error",
                    message: `success=false запрос api/landing/save-lead-api`,
                    context: "export const updateLead = async (",
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
            location: "services/admin/updateLead",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const updateLead = async (",
        }).catch(() => { console.error("logger error") });
    }


};