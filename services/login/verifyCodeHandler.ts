// services/login/sendCodeHandler.ts
// запрос дает команду сформировать код подтверждения в базе и отправить его юзеру
// (на email или телефон, в зависимости от purpose)
// не ждём результата отправки - просто ждём, что запрос принят к обработке
import { ulogger } from "./../../lib/common/universal-logger";

export const verifyCodeHandler = async (
    emailValue: string,
    purpose: string,
    code: string,
    verifyTokenOld: string,
    t: (s: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setStep: (step: number) => void,
    setRedirectIn: (sec: number) => void,
): Promise<string> => {

    let verifyToken = verifyTokenOld;
    setMessage('');
    try {

        const res = await fetch('/api/auth/verify-code',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
                body: JSON.stringify({
                    email: emailValue,
                    purpose,
                    code

                }),
            }
        );

        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: null,
                location: "services/login/verifyCodeHandler",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: `export const verifyCodeHandler = async ({, login = ${emailValue}`,
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success && receivedData.verifyToken) {
                verifyToken = receivedData.verifyToken;
                if (purpose === 'password_reset') {
                    setMessage(t('register.canchange'));
                    setStep(1);
                } else {
                    setMessage(t('register.mailconfirmed'));
                    setRedirectIn(10); // ← запуск таймера редиректа
                }
            } else {
                setMessage(t('register.incorrectcode'));
                // здесь без логера - это не ошибка сервера, а просто неверный код
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
            userId: null,
            location: "services/login/verifyCodeHandler",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: `export const verifyCodeHandler = async ({, login = ${emailValue}`,
        }).catch(() => { console.error("logger error") });
    }
    return verifyToken;

}

