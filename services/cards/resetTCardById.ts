import { Dispatch } from "redux";
import { TCardItem } from "@/types/types";
import { setTCards } from "@/store/slices";

export const resetTCardById = async (
    idToReset: number,
    tCards: TCardItem[],
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,

) => {


    const indexCardToSave = tCards.findIndex(card => card.id === idToReset);
    if (indexCardToSave < 0) return;
    // если карта не модифицирована то нечего сбрасывать все идентично
    if (!tCards[indexCardToSave].modified) return;


    const tCard = tCards[indexCardToSave]

    try {
        const res = await fetch(`api/tcard-api?tCardId=${tCard.id}`,
            {
                method: 'get',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
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