import { Dispatch } from "redux";
import { TCardItem, TeamItem } from "./../../types/types";
import { setTCards } from "./../../store/slices";

export const resetTCardById = async (
    userId:number,
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
        const res = await fetch(`api/tcard-api?tCardId=${tCard.id}&teamId=${team.id}&userId=${userId}`,
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
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                //   Обновим текущую карту в списке
                const tCard = receivedData.tCard as TCardItem
                const updatedTCards = [...tCards];
                updatedTCards.splice(indexCardToSave, 1, { ...tCard, modified: false })
                dispatch(setTCards(updatedTCards));
                setMessage("Карта успешно прочитана");
            }
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
};