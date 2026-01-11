import { Dispatch } from "redux";
import { UnitItem, UnitActionItem, UnitExceptionItem, TeamItem, UserItem } from "./../../types/types";
import { setUnits, setUnitActions, setUnitExceptions } from "./../../store/slices";

import { ulogger } from "./../../lib/common/universal-logger";

export const saveUnits = async (
    unitsValue: UnitItem[],
    actionsValue: UnitActionItem[],
    exceptionsValue: UnitExceptionItem[],
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setUnitsValue: (val: UnitItem[]) => void,
    setActionsValue: (val: UnitActionItem[]) => void,
    setExceptionsValue: (val: UnitExceptionItem[]) => void,
) => {

    try {

        const res = await fetch(`api/units/units-api`,
            {
                method: 'post',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    userId: user.id,
                    teamId: team.id,
                    units: unitsValue,
                    unitActions: actionsValue,
                    exceptions: exceptionsValue
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: user.id,
                location: "services/resources/saveUnits",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveUnits = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const units_ = receivedData.units as UnitItem[]
                units_.sort((a, b) => {
                    // Проверка на undefined
                    const idA = a.id ?? 0; // Если id a не существует, считаем его 0
                    const idB = b.id ?? 0; // Если id b не существует, считаем его 0          
                    return idA - idB; // Сравниваем id
                });
                const exceptions_ = receivedData.exceptions as UnitExceptionItem[]
                const actions_ = receivedData.actions as UnitActionItem[]

                // сеансовое хранилище                  
                dispatch(setUnits(units_));
                dispatch(setUnitExceptions(exceptions_));
                dispatch(setUnitActions(actions_));
                // временное хранилище                  
                setUnitsValue(units_);
                setExceptionsValue(exceptions_)
                setActionsValue(actions_)
                
                setMessage(receivedData.error)
                setMessage(t('units.unitsUpdated'));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/resources/saveUnits",
                    event: "error",
                    message: `success=false запрос api/units/units-api`,
                    context: "export const saveUnits = async (",
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
            userId: user.id,
            location: "services/resources/saveUnits",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveUnits = async (",
        }).catch(() => { console.error("logger error") });
    }

};