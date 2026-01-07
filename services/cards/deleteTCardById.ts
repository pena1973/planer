

import { Dispatch } from "redux";
import { TCardItem, UnitLoadItem, TeamItem } from "./../../types/types";
import { setTCards, setUnitLoads } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const deleteTCardById = async (
    userId: number,
    idToRemove: number,
    token: string,
    team: TeamItem,
    tCards: TCardItem[],
    unitLoads: UnitLoadItem[],
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
) => {

    try {
        // запрос получение текста из БД вместе со словами     textId: number, userId:number      
        // const res = await fetch(`api/tCard/tcard-api?tCardId=${idToRemove}&teamId=${team.id}`,
        const res = await fetch(`api/tCard/tcard-api`,
            {
                method: 'delete',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    tCardId: idToRemove,
                    userId: userId,
                    teamId: team.id,
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
                location: "services/cards/deleteTCardById",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const deleteTCardById = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {

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
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/cards/deleteTCardById",
                    event: "error",
                    message: `success=false запрос api/tCard/tcard-api`,
                    context: "export const deleteTCardById = async (",
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
            location: "services/cards/deleteTCardById",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const deleteTCardById = async (",
        }).catch(() => { console.error("logger error") });
    }
};