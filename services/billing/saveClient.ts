
import { ClientItem } from "./../../types/service-types";

import { ulogger } from "./../../lib/common/universal-logger";

export const saveClient = async (
    userId: number,
    teamId: number,
    client: ClientItem,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setClientForm: (val: ClientItem) => void,) => {

    try {

        const res = await fetch(`api/billing/client-api`,
            {
                method: 'post',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    client: client
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
                location: "services/billing/saveClient",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: " export const saveClient = async (",
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
                    location: "services/billing/saveClient",
                    event: "error",
                    message: `success=false запрос api/billing/client-api`,
                    context: "export const saveClient = async (",
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
            location: "services/billing/saveClient",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveClient = async (",
        }).catch(() => { console.error("logger error") });
    }
};