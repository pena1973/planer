import { Dispatch } from "redux";
import { SettingsItem, TeamItem, UserItem } from "./../../types/types";
import { setSettings } from "./../../store/slices";

export const saveSystemSettings = async (
    settings: SettingsItem,
    isQualControlValue: boolean,
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setModified: (val: boolean) => void,
) => {

    setMessage("");
    const settings_ = { ...settings, isQualControl: isQualControlValue, }

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
                    settings: settings_,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                dispatch(setSettings(receivedData.settings as SettingsItem));
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
