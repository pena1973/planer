
import { Dispatch } from "redux";
import { TeamItem, ScheduleItem, UserItem, DaysOfWeek } from "./../../types/types";
import { setSchedule } from "./../../store/slices";
import { ulogger } from "./../../lib/common/universal-logger";

export const saveSchedule = async (
    schedule: ScheduleItem,
    team: TeamItem,
    user: UserItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    locale: string,
    setMessage: (msg: string) => void,
    setTimeStartWorkValue: (val: number) => void,
    setTimeFinishWorkValue: (val: number) => void,
    setBreaksValue: (val: { timeStart: number, timeFinish: number }[]) => void,
    setHolidaysValue: (val: string[]) => void,
    setWeekendsValue: (val: (DaysOfWeek | null)[]) => void,
    setWorkdaysValue: (val: { date: string, timeStart: number, timeFinish: number }[]) => void,
    setTimeZoneValue: (val: string) => void,    
) => {

    try {
        const res = await fetch(`api/schedule-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json',
                    "X-Lang": locale,
                }),
                body: JSON.stringify({
                    schedule: schedule,
                    userId: user.id,
                    teamId: team.id,
                }),
            }
        );
        if (res.status !== 200) {
            const receivedData = await res.json();
            const error = receivedData.error;
            setMessage(`${t('service.serverUnavailable')} ${error}`);
            //  logger
            void ulogger.error({
                userId: user.id,
                location: "services/resources/saveSchedule",
                event: "endpoint_error",
                message: `res.status=${res.status} error=${error}`,
                context: "export const saveSchedule = async (",
            }).catch(() => { console.error("logger error") });
        } else {
            const receivedData = await res.json();

            if (receivedData.success) {
                const schedule = receivedData.schedule as ScheduleItem
                dispatch(setSchedule(schedule));
                setTimeStartWorkValue(schedule.timeStartWork);
                setTimeFinishWorkValue(schedule.timeFinishWork);
                setBreaksValue(schedule.breaks);
                setHolidaysValue(schedule.holidays);
                setWeekendsValue(schedule.weekends);
                setWorkdaysValue(schedule.workdays);
                setTimeZoneValue(schedule.timeZone);                
                setMessage(t('teamSchedule.schedueUpdated'));
            } else {
                setMessage(receivedData.message);
                //  logger
                void ulogger.error({
                    userId: user.id,
                    location: "services/resources/saveSchedule",
                    event: "error",
                    message: `success=false запрос api/schedule-api`,
                    context: "export const saveSchedule = async (",
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
            userId: user.id,
            location: "services/resources/saveSchedule",
            event: "endpoint_error",
            message: `catch: ${error}`,
            context: "export const saveSchedule = async (",
        }).catch(() => { console.error("logger error") });
    }    
};