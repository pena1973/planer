import { Dispatch } from "redux";
import { SettingsItem, TeamItem, UserItem } from "./../../types/types";
import { setSettings } from "./../../store/slices";

import { ulogger } from "./../../lib/common/universal-logger";

export const saveSystemSettings = async (
    settings: SettingsItem,
    isQualControlValue: boolean,
    user: UserItem,
    team: TeamItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
) => {

    setMessage("");
    const settings_ = { ...settings, isQualControl: isQualControlValue, }

    try {

        const res = await fetch(`api/settings-api`,
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
                    settings: settings_,
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
                location: "services/resources/saveSystemSettings",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveSystemSettings = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                dispatch(setSettings(receivedData.settings as SettingsItem));
                setMessage(t('settings.settingUpdated'));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/resources/saveSystemSettings",
                    event: "error",
                    message: `success=false запрос api/settings-api`,
                    context: "export const saveSystemSettings = async (",
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
            location: "services/resources/saveSystemSettings",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveSystemSettings = async (",
        }).catch(() => { console.error("logger error") });
    }

};
