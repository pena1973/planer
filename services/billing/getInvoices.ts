
import { InvoiceItem } from "./../../types/service-types";

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
        const res = await fetch(`api/billing/invoice-api?userId=${userId}&teamId=${teamId}`,
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

            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            setMessage(receivedData.message);

            if (receivedData.success) {
                // проверили и вернули общий статус карты
                const invoices = receivedData.invoices as InvoiceItem[];
                setInvoicesValue(invoices);
            }
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }

}