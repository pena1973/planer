import { Dispatch } from "redux";
import { UnitLoadItem, TCardItem, StatusEnum } from "@/types/types";
import { setUnitLoads, setTCardPrepared, setTCardLighted, setTCards } from "@/store/slices";

export const erazeCard = async (
    tCardId: number,
    unitLoads: UnitLoadItem[],
    tCards: TCardItem[],
    token: string,
    userId: number,
    teamId: number,
    today: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,

) => {

    const tCardLoads = unitLoads.filter(load => load.id_tCard === tCardId)
    const unitLoadsWithoutCard = unitLoads.filter(load => load.id_tCard !== tCardId)
    try {
        const res = await fetch(`/api/eraze-card-plan-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    tCardLoads: tCardLoads,
                    tCardId: tCardId,
                    today: today,
                    teamId: teamId,
                    userId: userId,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                // Если успешно меняем статусы карты и операций
                const tCardStatus = receivedData.tCardStatus as StatusEnum;
                const updatedLoads = [...unitLoadsWithoutCard, ...receivedData.tCardLoads]
                dispatch(setUnitLoads(updatedLoads));

                //  поменяем статус карты если он изменился и после этого она перерисуется в запланированные
                const index = tCards.findIndex(tCard => tCard.id === tCardId);
                if (tCards[index].status !== tCardStatus) {
                    const updatedTCard = { ...tCards[index], status: tCardStatus }
                    const _tCards = [...tCards]
                    _tCards.splice(index, 1, updatedTCard);
                    dispatch(setTCardPrepared(updatedTCard))
                    dispatch(setTCardLighted({} as TCardItem));
                    dispatch(setTCards(_tCards));
                } else {
                    setMessage("Карта уже выполнена и нет операций где статус меняется");
                }
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