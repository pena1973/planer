import { SupportMailItem } from "./../../types/types";

export const getSupportMails = async (
    teamId: number,    
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setSupportMessagesValue: (messages: SupportMailItem[]) => void
) => {

    try {
        const res = await fetch(`api/support-api?teamId=${teamId}`, {
            method: 'get',
            headers: new Headers({
                'Authorization': 'Basic ' + token,
                'Content-Type': 'application/json'
            }),
        });
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            setMessage(receivedData.message);
            if (receivedData.success) {
                const messages = receivedData.supportMessages as SupportMailItem[];
                setSupportMessagesValue(messages);
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