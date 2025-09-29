import { SupportMailItem } from "./../../types/types";
import { ulogger } from "./../../lib/common/universal-logger";

export const sendMail = async (
  messageToSend: SupportMailItem,
  supportMessages: SupportMailItem[],
  setSupportMessagesValue: (val: SupportMailItem[]) => void,
  userId: number,
  token: string,
  t: (key: string) => string,
  locale: string,
  setMessage: (msg: string) => void,
  setExpand?: (id: number) => void
) => {
  const index = supportMessages.findIndex(mes => mes.id === messageToSend.id);

  if (index < 0) return;

  try {
    const res = await fetch(`api/support-api`,
      {
        method: 'post',
        headers: new Headers({
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json',
          "X-Lang": locale,
        }),
        body: JSON.stringify({
          userId: userId,
          supportMessage: messageToSend
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
        location: "services/suport/sendMail",
        event: "endpoint_error",
        message: `res.status=${res.status} error=${error}`,
        context: "export const sendMail = async (",
      }).catch(() => { console.error("logger error") });
    } else {
      const receivedData = await res.json();
      setMessage(receivedData.message);
      if (receivedData.success) {
        // проверили и вернули общий статус карты
        const message = receivedData.supportMessage as SupportMailItem;
        const messages = [...supportMessages]
        messages.splice(index, 1, message)
        setSupportMessagesValue(messages);
        setExpand?.(message.id);
      } else {
        setMessage(receivedData.message);
        //  logger
        void ulogger.error({
          userId: userId,
          location: "services/suport/sendMail",
          event: "error",
          message: `success=false запрос api/support-api`,
          context: "export const sendMail = async (",
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
      location: "services/suport/sendMail",
      event: "endpoint_error",
      message: `catch: ${error}`,
      context: "export const sendMail = async (",
    }).catch(() => { console.error("logger error") });
  }
}
