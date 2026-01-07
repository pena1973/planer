import { Dispatch } from "redux";
import { ActionItem, TeamItem, UserItem } from "./../../types/types";
import { setActions } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const saveActions = async (
    actionsValue: ActionItem[],
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setActionsValue: (val: ActionItem[]) => void,
) => {

    try {

        const res = await fetch(`api/catalogs/actions-api`,
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
                    actions: actionsValue
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
                location: "services/process/downloadBaner",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadBaner = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const actions_ = receivedData.actions as ActionItem[]
                dispatch(setActions(actions_));
                setActionsValue(actions_)                
                setMessage(t('actionsCatalog.listUpdated'));                
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/process/downloadBaner",
                    event: "error",
                    message: `success=false запрос api/catalogs/actions-api`,
                    context: "export const downloadBaner = async (",
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
            location: "services/process/downloadBaner",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadBaner = async (",
        }).catch(() => { console.error("logger error") });
    }    
};