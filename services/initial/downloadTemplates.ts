import { TemplateItem } from '@/types/types';
import { setTemplates } from '@/store/slices';
import { Dispatch } from 'redux';

export const downloadTemplates = async (
  userId: number,
  teamId: number,
  token: string,
  t: (key: string) => string,
  setMessage: (msg: string) => void,
  dispatch: Dispatch
) => {

 
    // Загружаем классификатор действий
    try {
      const res = await fetch(`api/templates-api?userId=${userId}&teamId=${teamId}`,
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
          const templates_ = receivedData.templates as TemplateItem[]
          dispatch(setTemplates(templates_));
          // setMessage("Загружены шаблоны")
          setMessage(t('index.downloadTemplates'))
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
