// services/admin/getJobs
import { JobSettingItem } from "@/types/service-types";
import { ulogger } from "./../../lib/common/universal-logger";

export const getJobSetting = async (    
    userId: number,    
    token: string,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setJobs: (val: JobSettingItem[]) => void,) => {

    try {

        const res = await fetch(`api/admin/job-setting-api?userId=${userId}`,
            {
                method: 'get',
                headers: {
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                },
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: userId,
                location: "services/admin/getJobSetting",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const getBalance = async (",
            }).catch(() => { console.error("logger error") });

        } else {
            const receivedData = await res.json();
            if (receivedData.success) {
                const jobSetting = receivedData.jobSetting as JobSettingItem[];
                setJobs(jobSetting);
                setMessage("");
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: userId,
                    location: "services/admin/getJobSetting",
                    event: "error",
                    message: `success=false запрос api/billing/balance-api?userId=${userId}`,
                    context: "export const getBalance = async (",
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
            location: "services/admin/getJobSetting",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const getBalance = async (",
        }).catch(() => { console.error("logger error") });
    }
};