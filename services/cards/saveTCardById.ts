
import { Dispatch } from "redux";
import { TCardItem, TeamItem, UserItem } from "@/types/types";
import { setTCards } from "@/store/slices";
import { StatusEnum } from "@/types/types";

export const saveTCardById = async (
    idToSave: number,
    tCards: TCardItem[],
    token: string,
    team: TeamItem,
    user: UserItem,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,

) => {
    const indexCardToSave = tCards.findIndex(card => card.id === idToSave);
    if (indexCardToSave < 0) return;
    if (!tCards[indexCardToSave].modified) return;

    const tCard = tCards[indexCardToSave]

    try {
        const res = await fetch(`api/tcard-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
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
            setMessage(receivedData.error);
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
                setMessage("Карта успешно записана");
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
