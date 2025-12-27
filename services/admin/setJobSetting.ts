
import { JobSettingItem } from '@/types/service-types'

import { ulogger } from "./../../lib/common/universal-logger";

export const setJobSetting = async (
    userId: number,
    jobSetting: JobSettingItem,
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setJobs: (val: JobSettingItem[]) => void,
) => {

    try {
        const res = await fetch(`api/admin/job-setting-api`,
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
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/admin/setJobSetting",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const setJobSetting = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const jobSetting = receivedData.jobSetting as JobSettingItem[];
                setJobs(jobSetting);
                setMessage("Успешно изменено раcписание");

            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/admin/setJobSetting",
                    event: "error",
                    message: `success=false запрос api/admin/job-setting-api`,
                    context: "export const setJobSetting = async (",
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
            location: "services/admin/setJobSetting",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const setJobSetting = async (",
        }).catch(() => { console.error("logger error") });
    }


};