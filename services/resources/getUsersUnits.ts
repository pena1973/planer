import { Dispatch } from "redux";
import { TeamItem, UserItem, UserUnitItem } from "./../../types/types";

export const getUsersUnits = async (
    user: UserItem,
    team: TeamItem,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setUsersUnits: (val: UserUnitItem[]) => void,
    users_units_old_ref: React.MutableRefObject<UserUnitItem[]>,

) => {

    try {
        const res = await fetch(`api/users-units-api?userId=${user.id}&teamId=${team.id}`,
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
                const users_units_ = receivedData.users_units as UserUnitItem[];
                setUsersUnits(users_units_);
                users_units_old_ref.current = users_units_;
            }
        }
    } catch (error: unknown) {
        let message = t('service.serverUnavailable');
        if (error instanceof Error) {
            message += error.message;
        }
        setMessage(message);
    }
}