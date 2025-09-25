import { SupportMailItem } from "./../../types/types";

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
      setMessage(receivedData.error);
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
      }
    }

  } catch (e: unknown) {
    let message = t('service.serverUnavailable');
    if (e instanceof Error) {
      message += e.message;
    }
    setMessage(message);
  }



}
