import { Dispatch } from "redux";
import { SettingsItem, TeamItem, UserItem } from "./../../types/types";
import { setSettings } from "./../../store/slices";

import { ulogger } from "./../../lib/common/universal-logger";

export const saveSettings = async (
    timeStartWorkValue: number,
    timeFinishWorkValue: number,
    showWeekendValue: boolean,
    showHolidayValue: boolean,
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setTimeStartWorkValue: (val: number) => void,
    setTimeFinishWorkValue: (val: number) => void,
    setShowWeekendValue: (val: boolean) => void,
    setShowHolidayValue: (val: boolean) => void,
) => {


    setMessage("");
    const settingsValue = {
        timeStartWork: timeStartWorkValue,
        timeFinishWork: timeFinishWorkValue,
        showWeekend: showWeekendValue,
        showHoliday: showHolidayValue,
    }

    try {
        const res = await fetch(`api/catalogs/settings-api`,
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
                    settings: settingsValue,
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
                location: "services/resources/saveSettings",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveSettings = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            // console.log("receivedData", receivedData)

            if (receivedData.success) {
                //   Обновим текущую карту
                const settings = receivedData.settings as SettingsItem
                dispatch(setSettings(settings));
                setTimeStartWorkValue(settings.timeStartWork);
                setTimeFinishWorkValue(settings.timeFinishWork);
                setShowWeekendValue(settings.showWeekend);
                setShowHolidayValue(settings.showHoliday);                
                setMessage(t('settings.settingUpdated'));                
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/resources/saveSettings",
                    event: "error",
                    message: `success=false запрос api/catalogs/settings-api`,
                    context: "export const saveSettings = async (",
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
            location: "services/resources/saveSettings",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveSettings = async (",
        }).catch(() => { console.error("logger error") });
    }
};
