
// получает информацию о состоянии команды  активная на данный момент или нет

import { ulogger } from "./../../lib/common/universal-logger";

export const getTeamActivity = async (
    userId: number,
    mainTeam: string,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setTeamActivity: (val: { teamId: number, active: boolean }[]) => void,
) => {

    try {

        const res = await fetch(`api/billing/activity-teams-api?userId=${userId}&mainTeam=${mainTeam}`,
            {
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
                location: "services/billing/getTeamActivity",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: " export const getTeamActivity = async (",
            }).catch(() => { console.error("logger error") });

        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const teamActivity = receivedData.teamActivity as { teamId: number, active: boolean }[]

                setTeamActivity(teamActivity);

                setMessage("");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/billing/getTeamActivity",
                    event: "error",
                    message: `success=false запрос api/billing/activity-teams-api?userId=${userId}&mainTeam=${mainTeam}`,
                    context: "export const getTeamActivity = async (",
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
            location: "services/billing/getTeamActivity",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getTeamActivity = async (",
        }).catch(() => { console.error("logger error") });
    }
};