//services/landing/saveLead

import { LeadItem } from "../../types/leads-types";
import { ulogger } from "../../lib/common/universal-logger";

export type SaveLeadResult =
    | { success: true }
    | { success: false; error: string };

export const createLead = async (
    lead: LeadItem,
    locale: string
): Promise<SaveLeadResult> => {
    try {
        const res = await fetch(`/api/landing/create-lead-api`, {
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
            return { success: false, error };
        } else {

            const receivedData = await res.json();
            if (receivedData.success) {
                // const lead_ = receivedData.lead as LeadItem
                return { success: true };
            } else {
                //  logger
                void ulogger.error({
                    userId: null,
                    location: "services/landing/saveLead",
                    event: "error",
                    message: `success=false запрос api/landing/save-lead-api`,
                    context: "export const saveLead = async (",
                }).catch(() => { console.error("logger error") });
                return { success: false, error: 'Unsuccessful saving' };
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
        return { success: false, error };
    }
};
