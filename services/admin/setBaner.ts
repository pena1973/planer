import { BanerItem } from '@/types/service-types'

export const setBaner = async (
    token: string,
    userId: number,
    baner: BanerItem,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
) => {

    try {
        const res = await fetch(`api/admin/baner-api`,
            {
                method: 'POST',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    baner: baner,
                    userId: userId,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                setMessage("Успешно установлен банер");
            } else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }


};