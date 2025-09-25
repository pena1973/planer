import { Dispatch } from "redux";
import { TeamItem, UserItem } from "./../../types/types";
import { setTeam } from "./../../store/slices";

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
    setModified: (val: boolean) => void
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
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const team_ = receivedData.team as TeamItem
                dispatch(setTeam(team_));
                setModified(false);
                setMessage(t('team.settingUpdated'));
            } else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
    setModified(false);
};
