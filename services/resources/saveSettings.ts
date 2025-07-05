import { Dispatch } from "redux";
import { SettingsItem, TeamItem, UserItem } from "@/types/types";
import { setSettings } from "@/store/slices";

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
    setMessage: (msg: string) => void,
    setModified: (val: boolean) => void,
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
        const res = await fetch(`api/settings-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
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
             setMessage(receivedData.error);                        
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
                setModified(false);
                setMessage(t('settings.settingUpdated'));
            } else setMessage(receivedData.error);
        }
        
    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }


    setModified(false);
};
