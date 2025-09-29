// services/login/sendCodeHandler.ts
// запрос дает команду сформировать код подтверждения в базе и отправить его юзеру
// (на email или телефон, в зависимости от purpose)
// не ждём результата отправки - просто ждём, что запрос принят к обработке
import { ulogger } from "./../../lib/common/universal-logger";

export const sendCodeHandler = async (
    login: string,
    purpose: string,
    t: (s: string) => string,
    locale: string,
    messageLogin: (msg: string) => void,) => {
    try {

        const res = await fetch(`api/auth/send-code`,
            {
                method: 'post',
                headers: new Headers({
                    // 'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),
                body: JSON.stringify({
                    email: login,
                    purpose: purpose,
                    locale: locale,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            messageLogin(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: null,
                location: "services/login/sendCodeHandler",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: `export const sendCodeHandler = async ({, login = ${login}`,
            }).catch(() => { console.error("logger error") });

        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                // messageLogin("Ушло писмо с кодом на " + login);
                messageLogin(t("mailCodeSent") + login);
            } else {
                messageLogin(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: null,
                    location: "services/login/sendCodeHandler",
                    event: "error",
                    message: `success=false запрос api/auth/send-code`,
                    context: `export const sendCodeHandler = async ({, login = ${login}`,
                }).catch(() => { console.error("logger error") });
            }
        }
    } catch (e: unknown) {
        let error = "";
        if (e instanceof Error) {
            error = e.message;
        }
        messageLogin(`${t('service.serverUnavailable')} ${error}`);

        //  logger
        void ulogger.error({
            userId: null,
            location: "services/login/sendCodeHandler",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: `export const sendCodeHandler = async ({, login = ${login}`,
        }).catch(() => { console.error("logger error") });
    }
}

