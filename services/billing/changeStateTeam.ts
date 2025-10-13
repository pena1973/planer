

import { setActiveTeam } from './../../store/slices';
import { Dispatch } from 'redux';

import { ulogger } from "./../../lib/common/universal-logger";

export const changeStateTeam = async (
    userId: number,
    teamId: number,
    teamIdToChange: number,
    state: boolean,
    teamActivity: { teamId: number, active: boolean }[],
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setTeamActivity: (val: { teamId: number, active: boolean }[]) => void,
    dispatch: Dispatch) => {

    try {

        const res = await fetch(`api/billing/activity-teams-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    teamIdToChange: teamIdToChange,
                    state: state
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
                location: "services/billing/changeStateTeam",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const changeStateTeam = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const teamActivity_ = teamActivity.map(ta => {
                    if (ta.teamId === teamIdToChange)
                        return { teamId: teamIdToChange, active: state }
                    else
                        return ta;
                })
                setTeamActivity(teamActivity_);
                // если это основная команда включим доступ
                if (teamIdToChange === teamId) dispatch(setActiveTeam(state));
                // setMessage("Команда успешно деактивирована");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/billing/changeStateTeam",
                    event: "error",
                    message: `success=false запрос api/billing/activity-teams-api`,
                    context: "export const changeStateTeam = async (",
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
            location: "services/billing/changeStateTeam",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const changeStateTeam = async (",
        }).catch(() => { console.error("logger error") });
    }
};