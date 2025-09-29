import { ClientItem } from "./../../types/service-types";

import { ulogger } from "./../../lib/common/universal-logger";

export const getClient = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setClientForm: (val: ClientItem) => void,) => {

    try {

        const res = await fetch(`api/billing/client-api?userId=${userId}&teamId=${teamId}`,
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
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/billing/getClient",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: " export const getClient = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const client_ = receivedData.client as ClientItem

                setClientForm(client_);

                setMessage("Обновлены реквизиты клиента");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/billing/getClient",
                    event: "error",
                    message: `success=false запрос api/billing/client-api?userId=${userId}&teamId=${teamId}`,
                    context: "export const getClient = async (",
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
            location: "services/billing/getClient",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getClient = async (",
        }).catch(() => { console.error("logger error") });
    }
};