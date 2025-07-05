import {
  TCardItem,
  TCardOperationItem,
  UnitLoadItem
} from "@/types/types";

export const openOperation = async (
  load: UnitLoadItem,
  id_oper: number,
  id_tCard: number,
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  setMessage: (msg: string) => void,
  setCurrentTCard: (tCard: TCardItem) => void,
  setCurrentOper: (op: TCardOperationItem) => void,
  setCurrentLoad: (load: UnitLoadItem) => void
) => {

  try {
    const res = await fetch(`api/tcard-api?userId=${userId}&teamId=${teamId}&tCardId=${id_tCard}`,
      {
        method: 'get',
        headers: new Headers({
          'Authorization': 'Basic ' + token,
          'Content-Type': 'application/json'
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
        const tCard = receivedData.tCard as TCardItem
        setCurrentTCard(tCard);
        const oper = tCard.tCardOperations?.find((oper) => oper.id === id_oper);
        if (!oper) return
        setCurrentOper(oper as TCardOperationItem);
        setCurrentLoad(load as UnitLoadItem);
        setMessage(receivedData.message);
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