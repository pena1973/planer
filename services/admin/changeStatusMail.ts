import { SupportMailItem,StatusEnum } from "./../../types/types";

export const changeStatusMail = async (
    mailId: number,
    status: StatusEnum,
    supportMails: SupportMailItem[],
    setSupportMails: (val: SupportMailItem[]) => void,
    token: string,
    t: (key: string) => string,
    setMessage: (msg: string) => void,

) => {

    try {
        const res = await fetch(`api/admin/mail-status-api`,
            {
                method: 'POST',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    mailId: mailId,
                    status:status,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const supportMails_ = supportMails.map(mes => (mes.id === mailId) ? { ...mes, status: status } : mes)
                setSupportMails(supportMails_);
                setMessage("Успешно обработан мейл");
            } else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }


};