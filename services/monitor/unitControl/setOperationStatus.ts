import {
  StatusEnum,
  UnitLoadItem,
  TCardOperationItem,
  TCardItem
} from "@/types/types";

export const setOperationStatus = async (
  status: StatusEnum,
  currentOper: TCardOperationItem,
  currentLoad: UnitLoadItem,
  currentTCard: TCardItem,
  performedLoads: UnitLoadItem[],
  token: string,
  teamId: number,
  userId: number,
  t: (key: string) => string,
  setMessage: (msg: string) => void,
  setStatusLoadsHandler: (
    tCardStatus: StatusEnum,
    newStatus: StatusEnum,
    loadsIds: number[],
    operId: number,
    tCardId: number
  ) => void,
 
) => {

    const operloadsIds = performedLoads
      .filter(lo => lo.id_oper === currentOper.id && lo.version === currentLoad.version && lo.status === StatusEnum.performed)
      .map(load => load.id as number); //  все лоады операции

    try {
      const res = await fetch(`api/tcard-oper-status-api`,
        {
          method: 'post',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            tCardId:currentLoad.id_tCard,
            operId: currentOper.id,            
            status: status,
            teamId: teamId,
            userId: userId,
            version:currentLoad.version,
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
          const tCardStatus = receivedData.tCardStatus as StatusEnum
          //   Обновим статус лоадов
          setStatusLoadsHandler(tCardStatus, status, operloadsIds, Number(currentOper.id), currentTCard.id);
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