
import { Dispatch } from 'redux';
import { UserItem } from "./../../types/types";
import { setUser } from './../../store/slices';

export const changePassword = async (
    oldpass: string,
    newpass: string,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    dispatch: Dispatch,
    setMessage: (message: string) => void,

): Promise<boolean> => {
    let success = false;
    try {
        const res = await fetch(`api/profile-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
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
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();

            if (receivedData.success) {
                const user_ = receivedData.user as UserItem
                dispatch(setUser(user_));
                setMessage(t('profile.passUpdated'));
                success = true;
            } else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
    return success
}


export const changeName = async (
    name: string,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    dispatch: Dispatch,
    setMessage: (message: string) => void,
): Promise<boolean> => {
    let success = false;
    setMessage("");
    try {
        const res = await fetch(`api/profile-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    name: name,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {

                const user_ = receivedData.user as UserItem
                dispatch(setUser(user_));
                success = true;

                setMessage(t('profile.userUpdated'));
            } else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
    return success

}

export const deleteProfile = async (
    isAdmin: boolean,
    userId: number,
    teamId: number,
    token: string,
    t: (key: string) => string,
    setMessage: (message: string) => void,
): Promise<boolean> => {

    let success = false;
  
    try {
        const res = await fetch(`api/profile-api`,
            {
                method: 'delete',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    userId: userId,
                    teamId: teamId,
                    isAdmin: isAdmin,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            return receivedData.success;
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
    return success
}
