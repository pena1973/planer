
import { Dispatch } from "redux";
import { TCardItem, TeamItem, UserItem } from "./../../types/types";
import { setTCards } from "./../../store/slices";
import { StatusEnum } from "./../../types/types";
import { ulogger } from "./../../lib/common/universal-logger";

export const saveTCardById = async (
    idToSave: number,
    tCards: TCardItem[],
    token: string,
    team: TeamItem,
    user: UserItem,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,

) => {
    const indexCardToSave = tCards.findIndex(card => card.id === idToSave);
    if (indexCardToSave < 0) return;
    if (!tCards[indexCardToSave].modified) return;

    const tCard = tCards[indexCardToSave]

    try {
        const res = await fetch(`api/tCard/tcard-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),
                body: JSON.stringify({
                    teamId: team.id,
                    userId: user.id,
                    tCard: tCard,
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
                location: "services/cards/saveTCardById",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveTCardById = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                //   Обновим текущую карту
                const tCard1 = receivedData.tCard as TCardItem
                let updatedTCards = [...tCards];
                if (tCard1.status === StatusEnum.closed) {
                    updatedTCards = tCards.filter(card => !(card.idc === tCard1.idc && card.date === tCard1.date))
                } else {
                    updatedTCards.splice(indexCardToSave, 1, tCard1)
                }
                dispatch(setTCards(updatedTCards));
                setMessage(t("mes.tCardRecorded"));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/cards/saveTCardById",
                    event: "error",
                    message: `success=false запрос api/tCard/tcard-api`,
                    context: "export const saveTCardById = async (",
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
            location: "services/cards/saveTCardById",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveTCardById = async (",
        }).catch(() => { console.error("logger error") });
    }
};
