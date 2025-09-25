import { SupportMailItem } from "./../../types/types";

export const getSupportMailsAdmin = async (    
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
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            setMessage(receivedData.message);
            if (receivedData.success) {
                const mails = receivedData.supportMessages as SupportMailItem[];
                setSupportMailsValue(mails);
            }
        }
    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }

};