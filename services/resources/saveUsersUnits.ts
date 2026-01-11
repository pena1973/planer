
import { TeamItem, UserItem, UserUnitItem } from "./../../types/types";
import { ulogger } from "./../../lib/common/universal-logger";
import { Dispatch } from 'redux';
import { setUserUnits } from './../../store/slices';

export const saveUsersUnits = async (
    users_units: UserUnitItem[],
    user: UserItem,
    team: TeamItem,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setUsersUnits: (val: UserUnitItem[]) => void,
    dispatch: Dispatch,
) => {

    try {
        const res = await fetch(`api/units/users-units-api`,
            {
                method: 'post',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    userId: user.id,
                    teamId: team.id,
                    users_units: users_units
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
                location: "services/resources/saveUsersUnits",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveUsersUnits = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const users_units_ = receivedData.users_units as UserUnitItem[]
                setUsersUnits(users_units_)
                dispatch(setUserUnits(users_units_));                   
                setMessage(t('users.usersUpdated'));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/resources/saveUsersUnits",
                    event: "error",
                    message: `success=false запрос api/users-units-api`,
                    context: "export const saveUsersUnits = async (",
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
            location: "services/resources/saveUsersUnits",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveUsersUnits = async (",
        }).catch(() => { console.error("logger error") });
    }

};