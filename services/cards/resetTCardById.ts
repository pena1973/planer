import { Dispatch } from "redux";
import { TCardItem, TeamItem } from "./../../types/types";
import { setTCards } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const resetTCardById = async (
    userId: number,
    idToReset: number,
    tCards: TCardItem[],
    token: string,
    team: TeamItem,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,

) => {

    const indexCardToSave = tCards.findIndex(card => card.id === idToReset);
    if (indexCardToSave < 0) return;
    // если карта не модифицирована то нечего сбрасывать все идентично
    if (!tCards[indexCardToSave].modified) return;
    const tCard = tCards[indexCardToSave]

    try {
        const res = await fetch(`api/tCard/tcard-api?tCardId=${tCard.id}&teamId=${team.id}&userId=${userId}`,
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
                location: "services/cards/resetTCardById",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const resetTCardById = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                //   Обновим текущую карту в списке
                const tCard = receivedData.tCard as TCardItem
                const updatedTCards = [...tCards];
                updatedTCards.splice(indexCardToSave, 1, { ...tCard, modified: false })
                dispatch(setTCards(updatedTCards));
                setMessage(t("mes.tCardRead"));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/cards/resetTCardById",
                    event: "error",
                    message: `success=false запрос api/tCard/tcard-api?tCardId=${tCard.id}&teamId=${team.id}&userId=${userId}`,
                    context: "export const resetTCardById = async (",
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
            location: "services/cards/resetTCardById",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const resetTCardById = async (",
        }).catch(() => { console.error("logger error") });
    }
};