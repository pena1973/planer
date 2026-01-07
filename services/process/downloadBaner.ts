
import { BanerItem } from './../../types/service-types';
import { setBaner } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Показываем либо всем либо команде либо юзеру
export const downloadBaner = async (
    userId: number | undefined,
    teamId: number | undefined,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {
    // 🔹 формируем параметры запроса только если значения заданы
    const params = new URLSearchParams();
    if (userId !== undefined) params.append("userId", String(userId));
    if (teamId !== undefined) params.append("teamId", String(teamId));

    try {
        const res = await fetch(`/api/admin/baner-api${params.toString() ? "?" + params.toString() : ""}`, {

            method: 'get',
            headers: {
                'Authorization': 'Basic ' + token,
                'Content-Type': 'application/json',
                "X-Lang": locale,
            },
        }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/process/downloadBaner",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadBaner = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                //  массив банера на разных языках
                const baner = (receivedData.baner as BanerItem[])
                dispatch(setBaner(baner));
                setMessage(t('index.downloadBaner'))
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/process/downloadBaner",
                    event: "error",
                    message: `success=false запрос /api/admin/baner-api${params.toString() ? "?" + params.toString() : ""}`,
                    context: "export const downloadBaner = async (",
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
            location: "services/process/downloadBaner",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadBaner = async (",
        }).catch(() => { console.error("logger error") });
    }
};
