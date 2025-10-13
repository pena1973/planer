import { Dispatch } from "redux";
import { TeamItem, UserItem, UserUnitItem } from "./../../types/types";
import { ulogger } from "./../../lib/common/universal-logger";

export const getUsersUnits = async (
    user: UserItem,
    team: TeamItem,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setUsersUnits: (val: UserUnitItem[]) => void,
    users_units_old_ref: React.MutableRefObject<UserUnitItem[]>,

) => {

    try {
        const res = await fetch(`api/users-units-api?userId=${user.id}&teamId=${team.id}&withoutAdmin=${true}`,
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
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: user.id,
                location: "services/resources/getUsersUnits",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const getUsersUnits = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const users_units_ = receivedData.users_units as UserUnitItem[];
                setUsersUnits(users_units_);
                users_units_old_ref.current = users_units_;
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/resources/getUsersUnits",
                    event: "error",
                    message: `success=false запрос api/users-units-api?userId=${user.id}&teamId=${team.id}&withoutAdmin=${true}`,
                    context: "export const getUsersUnits = async (",
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
            location: "services/resources/getUsersUnits",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getUsersUnits = async (",
        }).catch(() => { console.error("logger error") });
    }
}