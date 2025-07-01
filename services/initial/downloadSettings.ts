import { SettingsItem } from '@/types/types';
import { setSettings } from '@/store/slices';
import { Dispatch } from 'redux';
 
export const downloadSettings = async (
     userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {
    try {
      const res = await fetch(`api/settings-api?userId=${userId}&teamId=${teamId}`,
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
          const settings = receivedData.schedule as SettingsItem
          dispatch(setSettings(settings));
          // setMessage("Загружены настройки календаря");
          setMessage(t('index.downloadSettings'))

        }
        else
          setMessage(receivedData.error);
      }
      
    } catch (e: unknown) {
      let message = t('service.serverUnavailable');
      if (e instanceof Error) {
        message += e.message;
      }
      setMessage(message);
    }

  }
