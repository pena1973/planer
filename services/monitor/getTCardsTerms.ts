import { TCardTermsItem, UnitLoadItem } from "./../../types/types";
import { ulogger } from "./../../lib/common/universal-logger";

export const getTCardsTerms = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setUnitLoadsValue: (val: UnitLoadItem[]) => void,
    setTCardsValue: (val: TCardTermsItem[]) => void,
    filter: string = "",
) => {

    try {
        const res = await fetch(`api/monitor/report-tcards-state-api?userId=${userId}&teamId=${teamId}${filter}`,
            {
                method: 'get',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/monitor/getTCardsTerms",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const getTCardsTerms = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                setUnitLoadsValue(receivedData.unitLoadItems as UnitLoadItem[]); // лоады по операциям
                setTCardsValue(receivedData.tCards as TCardTermsItem[]); //  получаем карту с операциями
                setMessage(receivedData.message);
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/monitor/getTCardsTerms",
                    event: "error",
                    message: `success=false запрос api/monitor/report-tcards-state-api?userId=${userId}&teamId=${teamId}${filter}`,
                    context: "export const getTCardsTerms = async (",
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
            location: "services/monitor/getTCardsTerms",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getTCardsTerms = async (",
        }).catch(() => { console.error("logger error") });
    }
}