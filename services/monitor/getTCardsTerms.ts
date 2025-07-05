import { TCardTermsItem, UnitLoadItem } from "@/types/types";

export const getTCardsTerms = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setUnitLoadsValue: (val: UnitLoadItem[]) => void,
    setTCardsValue: (val: TCardTermsItem[]) => void,
    filter: string = "",
) => {

    try {
        const res = await fetch(`api/report-tcards-state-api?userId=${userId}&teamId=${teamId}${filter}`,
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
            if (receivedData.success) {
                setUnitLoadsValue(receivedData.unitLoadItems as UnitLoadItem[]); // лоады по операциям
                setTCardsValue(receivedData.tCards as TCardTermsItem[]); //  получаем карту с операциями
                setMessage(receivedData.message);
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