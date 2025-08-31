
// получает информацию о состоянии команды  активная на данный момент или нет
// 
export const getTeamActivity = async (
    userId: number,
    mainTeam: string,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setTeamActivity: (val: { teamId: number, active: boolean }[]) => void,) => {

    try {

        const res = await fetch(`api/billing/activity-teams-api?userId=${userId}&mainTeam=${mainTeam}`,
            {
                method: 'get',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const teamActivity = receivedData.teamActivity as { teamId: number, active: boolean }[]

                setTeamActivity(teamActivity);

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