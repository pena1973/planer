import { Dispatch } from "redux";
import { UOMItem, TeamItem, UserItem } from "./../../types/types";
import { setUOMs } from "./../../store/slices";

export const saveUOMs = async (
    uomsValue: UOMItem[],
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setUomsValue: (val: UOMItem[]) => void,
    setModified: (val: boolean) => void
) => {

    try {

        const res = await fetch(`api/uoms-api`,
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
                    uoms: uomsValue
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const uoms_ = receivedData.uoms as UOMItem[]
                dispatch(setUOMs(uoms_));
                setUomsValue(uoms_);
                setModified(false);
                setMessage("Обновлен список единиц измерения");
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