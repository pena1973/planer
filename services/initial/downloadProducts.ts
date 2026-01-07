import { ProductItem } from './../../types/types';
import { setTCards } from './../../store/slices';
import { Dispatch } from 'redux';

export const downloadProducts = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch,   
) => {
    try {
        const res = await fetch(`/api/products-api?userId=${userId}&teamId=${teamId}`,
            {
                method: 'get',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                },
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(error);
            
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const products = receivedData.products as ProductItem[]
                
                const products_ = products.sort((a, b) => a.idc - b.idc);                
                dispatch(setTCards(products_));                
                setMessage(t('index.downloadProducts'))
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