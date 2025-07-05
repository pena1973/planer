import { StatusEnum, TCardItem, TCardOperationItem, UnitLoadItem } from "@/types/types";

export const setOperationStatus = async (
    status: StatusEnum,
    operId: number,
    tCardId: number,
    version: number,
    teamId: number,
    userId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setStatusLoadsHandler: (
        tCardStatus: StatusEnum,
        newStatus: StatusEnum,
        loadsIds: number[],
        operId: number,
        tCardId: number
    ) => void,

) => {


    try {
        const res = await fetch(`api/tcard-oper-status-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    tCardId: tCardId,
                    operId: operId,
                    version: version,
                    status: status,
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
            setMessage(receivedData.message);
            if (receivedData.success) {
                // проверили и вернули общий статус карты
                const tCardStatus = receivedData.tCardStatus as StatusEnum
                const operLoadsIds = receivedData.operLoadsIds as number[]
                //   Обновим статус лоадов
                setStatusLoadsHandler(tCardStatus, status, operLoadsIds, operId, tCardId);
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


    // setCurrentOper({} as TCardOperationItem);
    // setCurrentTCard({} as TCardItem);
    // setCurrentLoad({} as UnitLoadItem);
    // // закроем детали операции
    // setOperView(false);
}
