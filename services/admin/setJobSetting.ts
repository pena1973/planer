
import { JobSettingItem } from '@/types/service-types'

export const setJobSetting = async (   
    userId: number,
    jobSetting: JobSettingItem, 
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
) => {

    try {
        const res = await fetch(`api/admin/set-job-setting-api`,
            {
                method: 'POST',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale, 
                }),
                body: JSON.stringify({
                    jobSetting: jobSetting,
                    userId: userId,

                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            setMessage(receivedData.error);
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                setMessage("Успешно изменено рамписание");
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