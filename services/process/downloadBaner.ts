
import { BanerItem } from './../../types/service-types';
import { setBaner } from './../../store/slices';
import { Dispatch } from 'redux';


// Показываем либо всем либо команде либо юзеру
export const downloadBaner = async (
    userId: number | undefined,
    teamId: number | undefined,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {
    // 🔹 формируем параметры запроса только если значения заданы
    const params = new URLSearchParams();
    if (userId !== undefined) params.append("userId", String(userId));
    if (teamId !== undefined) params.append("teamId", String(teamId));

    try {
        const res = await fetch(`/api/baner-api${params.toString() ? "?" + params.toString() : ""}`, {

            method: 'get',
            headers: new Headers({
                'Authorization': 'Basic ' + token,
                'Content-Type': 'application/json'
            }),
        }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(error);
            setMessage(t('service.serverUnavailable') + error);
        } else {
            const receivedData = await res.json();
            // console.log("receivedData", receivedData)        
            if (receivedData.success) {
                //  массив банера на разных языках
                const baner = (receivedData.baner as BanerItem[])
                dispatch(setBaner(baner));
                setMessage(t('index.downloadBaner'))
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
