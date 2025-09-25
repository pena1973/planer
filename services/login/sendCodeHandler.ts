// services/login/sendCodeHandler.ts
// запрос дает команду сформировать код подтверждения в базе и отправить его юзеру
// (на email или телефон, в зависимости от purpose)
// не ждём результата отправки - просто ждём, что запрос принят к обработке

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

            console.log(t('service.serverUnavailable') + error);
            messageLogin(t('service.serverUnavailable') + res.status);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                console.log("Ушло писмо с кодом на", login)
                messageLogin("Ушло писмо с кодом на " + login);
            }
        }
    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
            messageLogin(message);
        }

    }

}

