import { TCardItem } from './../../types/types';
import { setTCards } from './../../store/slices';
import { Dispatch } from 'redux';
import { ulogger } from "./../../lib/common/universal-logger";

// Загружаем карты
export const downloadTCards = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch,
) => {
    try {
        const res = await fetch(`/api/tCard/tcards-api?userId=${userId}&teamId=${teamId}`,
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
                location: "services/initial/downloadTCards",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const downloadTCards = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const tCards = receivedData.tCards as TCardItem[]
                // Сортируем tCards по номеру (если number это число)
                const tCards_ = tCards.sort((a, b) => a.idc - b.idc);
                const tCardsUpdated = tCards_.map(card => { return { ...card, date: card.date, status: card.status } });
                dispatch(setTCards(tCardsUpdated));
                setMessage(t('index.downloadTCards'))
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/initial/downloadTCards",
                    event: "error",
                    message: `success=false запрос /api/tCard/tcards-api?userId=${userId}&teamId=${teamId}`,
                    context: "export const downloadTCards = async (",
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
            location: "services/initial/downloadTCards",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const downloadTCards = async (",
        }).catch(() => { console.error("logger error") });
    }
};