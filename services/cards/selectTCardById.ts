import { Dispatch } from "redux";
import { TCardItem, TeamItem, } from "./../../types/types";
import { setTCards, setTCardIndex } from "./../../store/slices";

export const selectTCardById = async (
    selectedTCardId:number,
    indexCurrentCard:number,    
    tCards: TCardItem[],
    token: string,
    team: TeamItem,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
) => {

    try {
        const res = await fetch(`api/tcard-api?tCardId=${selectedTCardId}&teamId=${team.id}`,
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
                updatedTCards.splice(indexCurrentCard, 1, { ...tCard, modified: false })
                dispatch(setTCards(updatedTCards));
                setMessage("Карта успешно прочитана из базы");
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