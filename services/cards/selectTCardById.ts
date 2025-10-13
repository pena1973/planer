import { Dispatch } from "redux";
import { TCardItem, TeamItem, } from "./../../types/types";
import { setTCards } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const selectTCardById = async (
    userId: number,
    selectedTCardId: number,
    indexCurrentCard: number,
    tCards: TCardItem[],
    token: string,
    team: TeamItem,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
) => {

    try {
        const res = await fetch(`api/tcard-api?tCardId=${selectedTCardId}&teamId=${team.id}&userId=${userId}`,
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
                location: "services/cards/selectTCardById",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const selectTCardById = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                //   Обновим текущую карту в списке
                const tCard = receivedData.tCard as TCardItem
                const updatedTCards = [...tCards];
                updatedTCards.splice(indexCurrentCard, 1, { ...tCard, modified: false })
                dispatch(setTCards(updatedTCards));
                setMessage(t("mes.tCardRead"));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/cards/selectTCardById",
                    event: "error",
                    message: `success=false запрос api/tcard-api?tCardId=${selectedTCardId}&teamId=${team.id}&userId=${userId}`,
                    context: "export const selectTCardById = async (",
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
            location: "services/cards/selectTCardById",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const selectTCardById = async (",
        }).catch(() => { console.error("logger error") });
    }
};