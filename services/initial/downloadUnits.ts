import { UnitItem } from '@/types/types';
import { setUnits } from '@/store/slices';
import { Dispatch } from 'redux';

export const downloadUnits = async (
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    dispatch: Dispatch
) => {
    // Загружаем классификатор действий
    try {
        const res = await fetch(`api/units-api?userId=${userId}&teamId=${teamId}`,
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
            //  console.log(t('service.serverUnavailable') + res.status);
            setMessage(t('service.serverUnavailable') + error);

        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const units_ = receivedData.units as UnitItem[]
                // сортируем          
                units_.sort((a, b) => {
                    // Проверка на undefined
                    const idA = a.id ?? 0; // Если id a не существует, считаем его 0
                    const idB = b.id ?? 0; // Если id b не существует, считаем его 0          
                    return idA - idB; // Сравниваем id
                });
                dispatch(setUnits(units_));
                // setMessage("Загружены юниты")
                setMessage(t('index.downloadUnits'))

            }
            else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }


}