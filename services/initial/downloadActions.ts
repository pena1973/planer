import { ActionItem } from '@/types/types';
import { setActions } from '@/store/slices';
import { Dispatch } from 'redux';

 export const downloadActions = async (
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/actions-api?userId=${userId}&teamId=${teamId}`,
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
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessage(t('service.serverUnavailable') + error);

      } else {
        const receivedData = await res.json();
        if (receivedData.success) {
          const actions_ = receivedData.actions as ActionItem[]
          dispatch(setActions(actions_));
          // setMessage("Загружены действия")
          setMessage(t('index.downloadActions'))
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