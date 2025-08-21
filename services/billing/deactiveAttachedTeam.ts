
import { TeamItem } from "./../../types/types";

export const deactiveAttachedTeam = async (
    userId: number,
    teamId_toDeactive: number,
    attachedTeams: TeamItem[],
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setAttachedTeams: (val: TeamItem[]) => void,) => {

    try {

        const res = await fetch(`api/invoices/attached-teams-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    userId: userId,
                    attachedTeamId: teamId_toDeactive,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const attachedTeam = receivedData.attachedTeam as TeamItem
                const attachedTeams_ = attachedTeams.filter(team => (team.id !== attachedTeam.id))
                setAttachedTeams(attachedTeams_);

                setMessage("Команда успешно деактивирована");
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