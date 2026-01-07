
import { Dispatch } from 'redux';
import { UserItem } from "./../../types/types";
import { setUser } from './../../store/slices';
import { ulogger } from "./../../lib/common/universal-logger";

export const changePassword = async (
    oldpass: string,
    newpass: string,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    dispatch: Dispatch,
    setMessage: (message: string) => void,

): Promise<boolean> => {
    let success = false;
    try {
        const res = await fetch(`api/profile-api`,
            {
                method: 'post',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    oldpass: oldpass,
                    newpass: newpass,
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
                location: "services/login/profileService/changePassword",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: `export const changePassword = async (`,
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();

            if (receivedData.success) {
                const user_ = receivedData.user as UserItem
                dispatch(setUser(user_));
                setMessage(t('profile.passUpdated'));
                success = true;
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/login/profileService/changePassword",
                    event: "error",
                    message: `success=false запрос api/profile-api`,
                    context: "export const changePassword = async (",
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
            location: "services/login/profileService/changePassword",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const changePassword = async (",
        }).catch(() => { console.error("logger error") });
    }
    return success
}

export const changeName = async (
    name: string,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    dispatch: Dispatch,
    setMessage: (message: string) => void,
): Promise<boolean> => {
    let success = false;
    setMessage("");
    try {
        const res = await fetch(`api/profile-api`,
            {
                method: 'post',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    name: name,
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
                location: "services/login/profileService/changeName",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: `export const changeName = async (`,
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {

                const user_ = receivedData.user as UserItem
                dispatch(setUser(user_));
                success = true;

                setMessage(t('profile.userUpdated'));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/login/profileService/changeName",
                    event: "error",
                    message: `success=false запрос api/profile-api`,
                    context: "export const changeName = async (",
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
            location: "services/login/profileService/changeName",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const changeName = async (",
        }).catch(() => { console.error("logger error") });
    }
    return success

}

export const deleteProfile = async (
    isAdmin: boolean,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (message: string) => void,
): Promise<boolean> => {

    let success = false;

    try {
        const res = await fetch(`api/profile-api`,
            {
                method: 'delete',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    isAdmin: isAdmin,
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
                location: "services/login/profileService/deleteProfile",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: `export const deleteProfile = async (`,
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                return receivedData.success;
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/login/profileService/deleteProfile",
                    event: "error",
                    message: `success=false запрос api/profile-api`,
                    context: "export const deleteProfile = async (",
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
            location: "services/login/profileService/deleteProfile",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const deleteProfile = async (",
        }).catch(() => { console.error("logger error") });
    }
    return success
}
