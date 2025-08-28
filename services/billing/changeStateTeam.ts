

import { setActiveTeam } from './../../store/slices';
import { Dispatch } from 'redux';

export const changeStateTeam = async (
    userId: number,
    teamId: number,
    teamIdToChange: number,
    state: boolean,
    teamActivity: { teamId: number, active: boolean }[],
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setTeamActivity: (val: { teamId: number, active: boolean }[]) => void,
    dispatch: Dispatch) => {

    try {

        const res = await fetch(`api/billing/activity-teams-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    userId: userId,
                    teamIdToChange: teamIdToChange,
                    state: state
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
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
            } else setMessage(receivedData.error);
        }
    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }


};