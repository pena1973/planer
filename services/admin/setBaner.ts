import { BanerItem } from '@/types/service-types'

import { ulogger } from "./../../lib/common/universal-logger";

export const setBaner = async (
    token: string,
    userId: number,
    baner: BanerItem,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
) => {

    try {
        const res = await fetch(`api/admin/baner-api`,
            {
                method: 'POST',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),
                body: JSON.stringify({
                    baner: baner,
                    userId: userId,
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
                location: "services/admin/changeStateTeam",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const setBaner = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                setMessage("Успешно установлен банер");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/admin/changeStateTeam",
                    event: "error",
                    message: `success=false запрос api/admin/baner-api`,
                    context: "export const setBaner = async (",
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
            location: "services/admin/changeStateTeam",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const setBaner = async (",
        }).catch(() => { console.error("logger error") });
    }


};