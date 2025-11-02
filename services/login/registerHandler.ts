import { Dispatch } from 'redux';
import { UserItem, TeamItem, SettingsItem, } from './../../types/types';
import { setUser, setToken, setTeam, setSettings, setSignedAgreement, setActiveTeam,setStep } from './../../store/slices';
import { getUserTimeZoneEnum } from './../../lib/common/timezone';
import { ulogger } from "./../../lib/common/universal-logger";

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
    locale: string,
    setMessage: (msg: string) => void,
    setMessageRegister: (msg: string) => void,
    dispatch: Dispatch,
    // setStep: (step: number) => void,
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
    locale,
    setMessage,
    setMessageRegister,
    dispatch,
    // setStep,
    agreementIdRef,
    agreementTextRef,
}: RegisterPayload) => {

    const tzValue = getUserTimeZoneEnum();

    try {

        const res = await fetch(`api/auth/register-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),
                body: JSON.stringify({
                    login: login,
                    pass: pass,
                    teamNumber: teamNumber,
                    createTeam: createTeam,
                    nickname: nickname,
                    basedOnTeam: basedOnTeam,
                    basedTeamNumber: basedTeamNumber,
                    timezone: tzValue,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessageRegister(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: null,
                location: "services/login/loginHandler",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: `export const registerHandler = async ({, login = ${login}`,
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
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
               dispatch(setStep(3));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: null,
                    location: "services/login/loginHandler",
                    event: "error",
                    message: `success=false запрос api/auth/register-api`,
                    context: `export const registerHandler = async ({, login = ${login}`,
                }).catch(() => { console.error("logger error") });
            }
        }
    } catch (e: unknown) {
        let error = "";
        if (e instanceof Error) {
            error = e.message;
        }
        setMessageRegister(`${t('service.serverUnavailable')} ${error}`);

        //  logger
        void ulogger.error({
            userId: null,
            location: "services/login/registerHandler",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: `export const registerHandler = async ({, login = ${login}`,
        }).catch(() => { console.error("logger error") });
    }

}

