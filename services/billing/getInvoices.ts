
import { InvoiceItem } from "./../../types/service-types";

import { ulogger } from "./../../lib/common/universal-logger";

export const getInvoices = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setInvoicesValue: (invoices: InvoiceItem[]) => void
) => {

    try {
        const res = await fetch(`api/billing/invoices-api?userId=${userId}&teamId=${teamId}`,
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
                location: "services/billing/getInvoices",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: " export const getInvoices = async (",
            }).catch(() => { console.error("logger error") });

        } else {
            const receivedData = await res.json();
            setMessage(receivedData.message);

            if (receivedData.success) {
                // проверили и вернули общий статус карты
                const invoices = receivedData.invoices as InvoiceItem[];
                setInvoicesValue(invoices);
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/billing/getInvoices",
                    event: "error",
                    message: `success=false запрос api/billing/invoice-api?userId=${userId}&teamId=${teamId}`,
                    context: "export const getInvoices = async (",
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
            location: "services/billing/getInvoices",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getInvoices = async (",
        }).catch(() => { console.error("logger error") });
    }
}