import { SupportMessageItem } from "@/types/types";

export const getSupportMessages = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setSupportMessagesValue: (messages: SupportMessageItem[]) => void
) => {

    try {
        const res = await fetch(`api/support-api?userId=${userId}&teamId=${teamId}`, {
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
                const messages = receivedData.supportMessages as SupportMessageItem[];
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