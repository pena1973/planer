
import { Dispatch } from "redux";
import { TeamItem, ScheduleItem, UserItem, DaysOfWeek } from "@/types/types";
import { setSchedule } from "@/store/slices";

export const saveSchedule = async (
    schedule: ScheduleItem,
    team: TeamItem,
    user: UserItem,
    token: string,
    dispatch: Dispatch,
    t: (key: string) => string,
    setMessage: (msg: string) => void,
    setTimeStartWorkValue: (val: number) => void,
    setTimeFinishWorkValue: (val: number) => void,
    setBreaksValue: (val: { timeStart: number, timeFinish: number }[]) => void,
    setHolidaysValue: (val: string[]) => void,
    setWeekendsValue: (val: (DaysOfWeek | null)[]) => void,
    setWorkdaysValue: (val: { date: string, timeStart: number, timeFinish: number }[]) => void,
    setTimeZoneValue: (val: string) => void,
    setModified: (val: boolean) => void
) => {

    try {
        const res = await fetch(`api/schedule-api`,
            {
                method: 'post',
                headers: new Headers({
                    'Authorization': 'Basic ' + token,
                    'Content-Type': 'application/json'
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
            setMessage(receivedData.error);
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
                setModified(false);
                setMessage(t('teamSchedule.schedueUpdated'));

            } else setMessage(receivedData.error);
        }

    } catch (e: unknown) {
        let message = t('service.serverUnavailable');
        if (e instanceof Error) {
            message += e.message;
        }
        setMessage(message);
    }
    setModified(false);
};