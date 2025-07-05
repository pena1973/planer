import { StatusEnum, UnitLoadItem } from "@/types/types";

export const setOperStatus = async (
    currentLoad: UnitLoadItem,
    outerLoads: UnitLoadItem[],
    status: StatusEnum,
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
    ) => void
) => {

    const operloadsIds = outerLoads
        .filter(lo => lo.id_oper === currentLoad.id_oper && lo.version === currentLoad.version && lo.status === StatusEnum.planed)
        .map(load => load.id as number); //  все лоады операции

    try {
        const res = await fetch(`api/tcard-oper-status-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    operId: currentLoad.id_oper,
                    loadsIds: operloadsIds,
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
                //   Обновим статус лоадов
                setStatusLoadsHandler(tCardStatus, status, operloadsIds, currentLoad.id_oper, currentLoad.id_tCard);
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

}