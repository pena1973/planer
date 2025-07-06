import { UnitActionItem } from './../../types/types';
import { setUnitActions } from './../../store/slices';
import { Dispatch } from 'redux';

export const downloadUnutActions = async (
  unitId: number|undefined,
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {
  if (unitId === undefined) {    
    return;    
  }
  // Загружаем классификатор действий
  try {
    const res = await fetch(`api/unit-actions-api?userId=${userId}&teamId=${teamId}&unitId=${unitId}`,
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
      const error = receivedData.error;
      setMessage(error);
      setMessage(t('service.serverUnavailable') + error);

    } else {
      const receivedData = await res.json();
      if (receivedData.success) {
        const unitActions = receivedData.actions as UnitActionItem[]
        dispatch(setUnitActions(unitActions));
        // setMessage("Загружены действия юнитов")
        setMessage(t('index.downloadUnutsActions'))
      }
      else setMessage(receivedData.error);
    }

  } catch (e: unknown) {
    let message = t('service.serverUnavailable');
    if (e instanceof Error) {
      message += e.message;
    }
    setMessage(message);
  }


}
