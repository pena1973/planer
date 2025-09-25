
import { TeamItem, UserItem, UserUnitItem } from "./../../types/types";

export const saveUsersUnits = async (
    users_units: UserUnitItem[],
    user: UserItem,
    team: TeamItem,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setUsersUnits: (val: UserUnitItem[]) => void,
    users_units_old_ref: React.MutableRefObject<UserUnitItem[]>,
    setModified: (val: boolean) => void,

) => {

    try {
        const res = await fetch(`api/users-units-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale, 
                }),
                body: JSON.stringify({
                    userId: user.id,
                    teamId: team.id,
                    users_units: users_units
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();            
            setMessage(receivedData.error);            
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {            
                const users_units_ = receivedData.users_units as UserUnitItem[]
                setUsersUnits(users_units_)
                users_units_old_ref.current = users_units_;
                setModified(false);                
                setMessage(t('users.usersUpdated'));
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