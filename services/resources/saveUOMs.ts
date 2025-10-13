import { Dispatch } from "redux";
import { UOMItem, TeamItem, UserItem } from "./../../types/types";
import { setUOMs } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

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
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: user.id,
                location: "services/resources/saveUOMs",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveUOMs = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const uoms_ = receivedData.uoms as UOMItem[]
                dispatch(setUOMs(uoms_));
                setUomsValue(uoms_);
                setMessage("Обновлен список единиц измерения");

            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/resources/saveUOMs",
                    event: "error",
                    message: `success=false запрос api/uoms-api`,
                    context: "export const saveUOMs = async (",
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
            location: "services/resources/saveUOMs",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveUOMs = async (",
        }).catch(() => { console.error("logger error") });
    }

};