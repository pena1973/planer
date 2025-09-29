import { Dispatch } from "redux";
import { UnitLoadItem, TCardItem, StatusEnum } from "./../../types/types";
import { setUnitLoads, setTCardPrepared, setTCardLighted, setTCards } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

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

    setMessage("");
    const tCardLoads = unitLoads.filter(load => load.id_tCard === tCardId)

    if (tCardLoads.length === 0) {
        // setMessage("Нет лоадов для отмены");
        setMessage(t("noLoadsToCancel"));
        return
    }

    const unitLoadsWithoutCard = unitLoads.filter(load => load.id_tCard !== tCardId)
    try {
        const res = await fetch(`/api/plan/eraze-card-plan-api`,
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
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/plan/erazeCard",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const erazeCard = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                // Если успешно меняем статусы операций


                // Если успешно меняем статусы лоадов
                const updatedLoads = [...unitLoadsWithoutCard, ...receivedData.tCardLoads]
                dispatch(setUnitLoads(updatedLoads));

                //  поменять статусы операций карты
                const canceledOperIds = receivedData.canceledOperIds as number[];
                const preparedOperIds = receivedData.preparedOperIds as number[];
                //  поменяем статус карты если он изменился и после этого она перерисуется в запланированные
                const tCardStatus = receivedData.tCardStatus as StatusEnum;

                const index = tCards.findIndex(tCard => tCard.id === tCardId);

                //  поменять статусы операций карты  если изменились
                const tCardOperations = tCards[index].tCardOperations?.map(oper => {
                    if (!oper.id) return oper;

                    if (preparedOperIds.includes(oper.id) && oper.status !== StatusEnum.prepared) {
                        return { ...oper, status: StatusEnum.prepared }
                    }

                    if (canceledOperIds.includes(oper.id) && oper.status !== StatusEnum.cancelled) {
                        return { ...oper, status: StatusEnum.cancelled }
                    }
                    return oper;
                })

                //  поменяем статус карты если он изменился и после этого она перерисуется в запланированные
                if (tCards[index].status !== tCardStatus) {
                    const updatedTCard = { ...tCards[index], status: tCardStatus, tCardOperations: tCardOperations }
                    const _tCards = [...tCards]
                    _tCards.splice(index, 1, updatedTCard);
                    dispatch(setTCardPrepared(updatedTCard))
                    dispatch(setTCardLighted({} as TCardItem));
                    dispatch(setTCards(_tCards));

                    // } else {
                    //     // setMessage("Карта уже выполнена и нет операций где статус меняется");
                    //     setMessage(t("cardPerformed"));
                }
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/plan/erazeCard",
                    event: "error",
                    message: `success=false запрос /api/plan/eraze-card-plan-api`,
                    context: "export const erazeCard = async (",
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
            location: "services/plan/erazeCard",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const erazeCard = async (",
        }).catch(() => { console.error("logger error") });
    }


};