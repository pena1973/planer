


export const deactivateTeamsByBalance = async (
    token: string,    
    t: (key: string) => string,
    setMessage: (msg: string) => void,
) => {

    try {
        const res = await fetch(`api/admin/deactivate-teams-balance-api`,
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
                setMessage("Успешно деактивированы команды неплательщики");
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