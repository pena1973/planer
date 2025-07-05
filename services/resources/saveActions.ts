import { Dispatch } from "redux";
import { ActionItem, TeamItem, UserItem } from "@/types/types";
import { setActions } from "@/store/slices";

export const saveActions = async (
    actionsValue: ActionItem[],
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setActionsValue: (val: ActionItem[]) => void,
    setModified: (val: boolean) => void
) => {

    try {

        const res = await fetch(`api/actions-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    userId: user.id,
                    teamId: team.id,
                    actions: actionsValue
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const actions_ = receivedData.actions as ActionItem[]
                dispatch(setActions(actions_));
                setActionsValue(actions_)
                setModified(false);
                setMessage(t('actionsCatalog.listUpdated'));

            } else setMessage(receivedData.error);
        }
    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
    setModified(false);
};