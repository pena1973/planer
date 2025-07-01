import { TCardItem } from '@/types/types';
import { setTCards } from '@/store/slices';
import { Dispatch } from 'redux';

export const downloadTCards = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {
    try {
        const res = await fetch(`/api/tcards-api?userId=${userId}&teamId=${teamId}`,
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
            const error = receivedData.error;
            setMessage(error);
            setMessage(t('service.serverUnavailable') + error);
        } else {
            const receivedData = await res.json();
            // console.log("receivedData", receivedData)        
            if (receivedData.success) {
                const tCards = receivedData.tCards as TCardItem[]
                // Сортируем tCards по номеру (если number это число)
                const tCards_ = tCards.sort((a, b) => a.idc - b.idc);
                const tCardsUpdated = tCards_.map(card => { return { ...card, date: card.date, status: card.status } });
                dispatch(setTCards(tCardsUpdated));
                // setMessage("Загружены карты");
                setMessage(t('index.downloadTCards'))
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