import { Dispatch } from "redux";
import { TCardItem, UnitLoadItem, StatusEnum } from "./../../types/types";
import { setTCardLighted, setTCardPrepared, setTCards, setUnitLoads } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const saveCard = async (
    tCardPrepared: TCardItem,
    unitLoads: UnitLoadItem[],
    tCards: TCardItem[],
    token: string,
    userId: number,
    teamId: number,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
) => {

    // setSaveLoaderCard(tCardPrepared.id);
    // Фильтруем загрузку по карте  и все что драфт и сохраняем  
    const tCardLoadsPrepared = unitLoads.filter(load => { return (load.id_tCard === tCardPrepared?.id && load.status === StatusEnum.prepared) })
    const tCardLoadsWithoutPrepared = unitLoads.filter(load => { return (load.id_tCard === tCardPrepared?.id && load.status !== StatusEnum.prepared) })
    const unitLoadsWithoutCard = unitLoads.filter(load => { return (load.id_tCard !== tCardPrepared?.id) })

    const index = tCards.findIndex(tCard => tCard.id === tCardPrepared.id);

    // ПРОВЕРКА и УсТАНОВКА СТАТУСА перед записью
    // если ничего не запланировалось а карта prepared, надо утановить правильный статус карты по текущему состоянию
    if (tCardLoadsPrepared.length === 0) {
        try {
            const res = await fetch(`api/tCard/tcard-status-api`,
                {
                    method: 'post',
                    headers: {
                        'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json',
                        "X-Lang": locale,
                    },
                    body: JSON.stringify({
                        tCardId: tCardPrepared.id,
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
                    location: "services/plan/saveCard",
                    event: "endpoint_error",
                    message: `res.status=${res.status} error=${error}`,
                    context: "(tCardLoadsPrepared.length === 0)",
                }).catch(() => { console.error("logger error") });
            } else {
                const receivedData = await res.json();
                if (receivedData.success) {
                    // проверили и вернули общий статус карты
                    const tCardStatus = receivedData.tCardStatus as StatusEnum
                    // статус карты меняем только тогда когда все операции будут не ниже этого статуса
                    const updatedTCard = { ...tCards[index], status: tCardStatus }
                    const _tCards = [...tCards]
                    _tCards.splice(index, 1, updatedTCard);
                    dispatch(setTCards(_tCards));
                    // setMessage(receivedData.message);
                    // "tCardSaved": "Карта сохранена"
                    setMessage(t("mes.tCardSaved"));
                } else {
                    setMessage(receivedData.message);
                    //  logger
                    void ulogger.error({
                        userId: userId,
                        location: "services/plan/saveCard",
                        event: "error",
                        message: `success=false запрос api/tCard/tcard-status-api`,
                        context: "(tCardLoadsPrepared.length === 0)",
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
                location: "services/plan/saveCard",
                event: "endpoint_error",
                message: `catch: ${error}`,
                context: "(tCardLoadsPrepared.length === 0)",
            }).catch(() => { console.error("logger error") });
        }

        return;
    }

    // если есть что записывать  то записываем подгоитовленное
    if (tCardLoadsPrepared.length > 0) {
        try {
            const res = await fetch(`/api/loads/save-card-loads-api`,
                {
                    method: 'post',
                    headers: {
                        'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json',
                        "X-Lang": locale,
                    },
                    body: JSON.stringify({
                        tCard: tCardPrepared,
                        tCardLoads: tCardLoadsPrepared,
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
                    location: "services/plan/saveCard",
                    event: "endpoint_error",
                    message: `res.status=${res.status} error=${error}`,
                    context: "(tCardLoadsPrepared.length > 0)",
                }).catch(() => { console.error("logger error") });
            } else {
                const receivedData = await res.json();
                if (receivedData.success) {
                    const tCardStatus = receivedData.tCardStatus;
                    const savedUnitLoads = receivedData.savedUnitLoads as UnitLoadItem[];
                    const updatedLoads = [...unitLoadsWithoutCard, ...tCardLoadsWithoutPrepared, ...savedUnitLoads]
                    dispatch(setUnitLoads(updatedLoads))

                    //  поменяем статус карты  и после этого она перерисуется в запланированные
                    //  и статус операций
                    const index = tCards.findIndex(tCard => tCard.id === tCardPrepared.id);

                    // idc операций в которых меняем статус
                    const operIdc = [...new Set(savedUnitLoads.map(load => load.idc_oper))];

                    const tCardOperations = tCards[index].tCardOperations?.map(operation => {
                        if (operIdc.includes(operation.idc)) {
                            return { ...operation, status: StatusEnum.planed };
                        }
                        return operation;
                    });

                    // статус карты меняем только тогда когда все операции будут не ниже этого статуса
                    const updatedTCard = { ...tCards[index], status: tCardStatus, tCardOperations: tCardOperations }
                    const _tCards = [...tCards]
                    _tCards.splice(index, 1, updatedTCard);
                    dispatch(setTCardLighted(updatedTCard))
                    dispatch(setTCardPrepared({} as TCardItem));
                    dispatch(setTCards(_tCards));
                    // setMessage("Планировка карты успешно записана");
                    setMessage(t("mes.tCardSaved"));
                } else {
                    setMessage(receivedData.message);
                    //  logger
                    void ulogger.error({
                        userId: userId,
                        location: "services/plan/saveCard",
                        event: "error",
                        message: `success=false запрос api/tCard/tcard-status-api`,
                        context: " (tCardLoadsPrepared.length > 0) ",
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
                location: "services/plan/saveCard",
                event: "endpoint_error",
                message: `catch: ${error}`,
                context: "(tCardLoadsPrepared.length > 0)",
            }).catch(() => { console.error("logger error") });
        }

    };
}
