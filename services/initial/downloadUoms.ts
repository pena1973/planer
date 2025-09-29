import { UOMItem } from './../../types/types';
import { setUOMs } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

export const downloadUoms = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch) => {
    try {
        const res = await fetch(`api/uoms-api?userId=${userId}&teamId=${teamId}`,
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
                userId: userId,
                location: "services/initial/downloadUoms",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadUoms = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const uoms_ = receivedData.uoms as UOMItem[]
                dispatch(setUOMs(uoms_));
                setMessage(t('index.downloadUoms'))
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/initial/downloadUoms",
                    event: "error",
                    message: `success=false запрос api/uoms-api?userId=${userId}&teamId=${teamId}`,
                    context: "export const downloadUoms = async (",
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
            userId: userId,
            location: "services/initial/downloadUoms",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadUoms = async (",
        }).catch(() => { console.error("logger error") });
    }
}