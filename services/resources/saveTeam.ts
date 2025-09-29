import { Dispatch } from "redux";
import { TeamItem, UserItem } from "./../../types/types";
import { setTeam } from "./../../store/slices";

import { ulogger } from "./../../lib/common/universal-logger";

export const saveTeam = async (
    titleValue: string,
    comentValue: string,
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
) => {
    setMessage("");

    try {
        const res = await fetch(`api/team-api?userId=${user.id}&teamId=${team.id}`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),
                body: JSON.stringify({
                    title: titleValue,
                    coment: comentValue,
                    teamId: team.id
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: user.id,
                location: "services/resources/saveTeam",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveTeam = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const team_ = receivedData.team as TeamItem
                dispatch(setTeam(team_));
                setMessage(t('team.settingUpdated'));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/resources/saveTeam",
                    event: "error",
                    message: `success=false запрос api/team-api?userId=${user.id}&teamId=${team.id}`,
                    context: "export const saveTeam = async (",
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
            userId: user.id,
            location: "services/resources/saveTeam",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveTeam = async (",
        }).catch(() => { console.error("logger error") });
    }

};
