import { BillItem } from "@/types/types";

export const getBills = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setBillsValue: (bills: BillItem[]) => void
) => {

    try {
        const res = await fetch(`api/billing-api?userId=${userId}&teamId=${teamId}`,
            {
                method: 'get',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
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
                const bills = receivedData.bills as BillItem[];
                setBillsValue(bills);
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