import { Dispatch } from 'redux';
import {
    UserItem,
    TeamItem,
    SettingsItem,
} from './../../types/types';
import {
    setUser,
    setToken,
    setTeam,
    setSettings,
    setSignedAgreement,
    setActiveTeam,
    
} from './../../store/slices';

interface RegisterPayload {
    login: string,
    pass: string,
    teamNumber: string,
    createTeam: boolean,
    basedOnTeam: boolean,
    basedTeamNumber: string,
    nickname: string,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setMessageRegister: (msg: string) => void,    
    dispatch: Dispatch,
    setStep: (step: number) => void,
    agreementIdRef: React.MutableRefObject<number>,
    agreementTextRef: React.MutableRefObject<string>,
}

export const registerHandler = async ({
    login,
    pass,
    teamNumber,
    createTeam,
    basedOnTeam,
    basedTeamNumber,
    nickname,
    token,
    t,
    setMessage,
    setMessageRegister,    
    dispatch,
    setStep,
    agreementIdRef,
    agreementTextRef,
}: RegisterPayload) => {

    try {

        const res = await fetch(`api/auth/register-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    login: login,
                    pass: pass,
                    teamNumber: teamNumber,
                    createTeam: createTeam,
                    nickname: nickname,
                    basedOnTeam: basedOnTeam,
                    basedTeamNumber : basedTeamNumber,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessageRegister(error);
            //  console.log(t('service.serverUnavailable') + res.status);
            // setMessageRegister(t('service.serverUnavailable') + res.status);
        } else {
            const receivedData = await res.json();
            // console.log("receivedData", receivedData)

            if (receivedData.success) {

                const user_ = receivedData.user as UserItem;
                const token_ = receivedData.token as string;
                const team_ = receivedData.team as TeamItem;
                const settings_ = receivedData.settings as SettingsItem;
                const agreementText_ = receivedData.agreementText as string;
                const agreementId_ = receivedData.agreementId as number
                const basedTeamNumber = receivedData.team as string;
                const activeTeam = receivedData.setActiveTeam as boolean;

                //   Обновим настройки
                dispatch(setUser(user_));
                dispatch(setToken(token_));
                dispatch(setTeam(team_));
                dispatch(setSettings(settings_));
                dispatch(setSignedAgreement(false));
                dispatch(setActiveTeam(Boolean(activeTeam)));
                 
                agreementIdRef.current = agreementId_;
                agreementTextRef.current = agreementText_
                //  далее адресуем на страницу соглашения и после этого переправляем на страницу настроек
                setStep(3);
                // setMessageRegister("Обновлены настройки");
            } else setMessageRegister(receivedData.error);
        }
    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }

}

