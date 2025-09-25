import { Dispatch } from "redux";
import {
    UnitItem,
    UnitActionItem,
    UnitExceptionItem,
    TeamItem,
    UserItem
} from "./../../types/types";
import {
    setUnits,
    setUnitActions,
    setUnitExceptions
} from "./../../store/slices";

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

        const res = await fetch(`api/units-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale, 
                }),
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
            setMessage(receivedData.error);
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
                // временное хранилище                  
                setUnitsValue(units_);
                // сеансовое хранилище                  
                dispatch(setUnits(units_));
                // отклонения                    
                setExceptionsValue(exceptions_)
                dispatch(setUnitExceptions(exceptions_));
                // отклонения                    
                setActionsValue(actions_)
                dispatch(setUnitActions(actions_));
                setMessage(receivedData.error)
                setMessage(t('units.unitsUpdated'));
            } else setMessage(receivedData.error);
        }
    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }

};