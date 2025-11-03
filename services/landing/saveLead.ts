//services/landing/saveLead

import { LeadItem } from "../../types/leads-types";
import { ulogger } from "../../lib/common/universal-logger";

export type SaveLeadResult =
    | { ok: true; lead: LeadItem }
    | { ok: false; error: string };

export const saveLead = async (
    lead: LeadItem,
    locale: string
): Promise<SaveLeadResult> => {
    try {
        const res = await fetch(`/api/landing/save-lead-api`, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json",
                "X-Lang": locale,
            }),
            body: JSON.stringify({
                lead: lead
            }),
        });

        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            //  logger
            void ulogger.error({
                userId: null,
                location: "services/landing/saveLead",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveLead = async (",
            }).catch(() => { console.error("logger error") });
            return { ok: false, error };
        } else {

            const receivedData = await res.json();
            if (receivedData.success) {
                const lead_ = receivedData.lead as LeadItem
                return { ok: true, lead: lead_ };
            } else {
                //  logger
                void ulogger.error({
                    userId: null,
                    location: "services/landing/saveLead",
                    event: "error",
                    message: `success=false запрос api/landing/save-lead-api`,
                    context: "export const saveLead = async (",
                }).catch(() => { console.error("logger error") });
                return { ok: false, error: 'Unsuccessful saving' };
            }

        }

    } catch (e: unknown) {
        let error = "";
        if (e instanceof Error) {
            error = e.message;
        }
        //  logger
        void ulogger.error({
            userId: null,
            location: "services/landing/saveLead",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveLead = async (",
        }).catch(() => { console.error("logger error") });
        return { ok: false, error };
    }
};
