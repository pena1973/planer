

import { Dispatch } from "redux";
import { TCardItem, UnitLoadItem } from "@/types/types";
import { setTCards, setUnitLoads } from "@/store/slices";

export const deleteTCardById = async (
    idToRemove: number,
    token: string,
    tCards: TCardItem[],
    unitLoads: UnitLoadItem[],
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
) => {

    try {
        // запрос получение текста из БД вместе со словами     textId: number, userId:number      
        const res = await fetch(`api/tcard-api?tCardId=${idToRemove}`,
            {
                method: 'delete',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',

                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {

                // const tCard = receivedData.tCard as TCardItem
                const indexCardToRemote = tCards.findIndex(card => card.id === idToRemove);
                const updatedTCards = [...tCards];
                // удаляем карту из списка
                updatedTCards.splice(indexCardToRemote, 1)
                dispatch(setTCards(updatedTCards));
                const unitLoads_ = unitLoads.filter(load => load.id_tCard !== idToRemove);

                // обновляем лоады
                const loads = receivedData.loads as UnitLoadItem[]
                const updatedLoads = [...unitLoads_, ...loads]
                dispatch(setUnitLoads(updatedLoads));

                setMessage(receivedData.message);
            } else {
                setMessage(receivedData.message);
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