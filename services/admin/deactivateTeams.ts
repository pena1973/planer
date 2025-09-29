// принудительно девктивирует команды у которых нулевой баланс

import { ulogger } from "./../../lib/common/universal-logger";

export const deactivateTeams = async (
    userId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
) => {

    try {
        const res = await fetch(`api/admin/deactivate-teams-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),

                body: JSON.stringify({
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
                location: "services/admin/deactivateTeams",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const deactivateTeams = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();

            if (receivedData.success) {
                setMessage("Успешно деактивированы команды неплательщики");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/admin/deactivateTeams",
                    event: "error",
                    message: `success=false запрос api/admin/deactivate-teams-api`,
                    context: "export const deactivateTeams = async (",
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
            location: "services/admin/deactivateTeams",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const deactivateTeams = async (",
        }).catch(() => { console.error("logger error") });
    }
};