

import { TeamItem } from "./../../types/types";

export const getAttachedTeams = async (
    userId: number,
    mainTeam: string,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setAttachedTeams: (val: TeamItem[]) => void,) => {

    try {

        const res = await fetch(`api/billing/attached-teams-api?userId=${userId}&mainTeam=${mainTeam}`,
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
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const attachedTeams = receivedData.attachedTeams as TeamItem[]

                setAttachedTeams(attachedTeams);

                setMessage("");
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