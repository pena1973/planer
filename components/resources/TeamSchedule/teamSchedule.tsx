
import styles from "./teamSchedule.module.scss";
import { saveSchedule } from '@/services/resources/saveSchedule';
import DropdownSelectWeekDay from "./DropdownSelectWeekDay/dropdownSelectWeekDay";
import DropdownSelectTimeZone from "./DropdownSelectTimeZone/dropdownSelectTimeZone";

import { DaysOfWeek, TeamItem, ScheduleItem, TimeZoneEnum } from '@/types/types'
import Image from 'next/image';

import { useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import { useTranslation } from 'react-i18next';
import { getCurrentDateInDate, getCurrentDateInString, getTimeZoneDateFromDateString } from "@/lib/client/timezone.client";
import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface TeamScheduleProps {
    setMessage: (message: string) => void,
    token: string
}

export default function TeamSchedule({
    setMessage,
    token
}: TeamScheduleProps) {

    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();

    const schedule = useAppSelector((state: RootState) => {
        return state.catalogSlice.schedule;
    })
    const team = useAppSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useAppSelector((state: RootState) => {
        return state.authSlice.user;
    })

    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы

    const [timeZoneValue, setTimeZoneValue] = useState("");
    const [timeStartWorkValue, setTimeStartWorkValue] = useState(0);
    const [timeFinishWorkValue, setTimeFinishWorkValue] = useState(0);
    const [breaksValue, setBreaksValue] = useState([] as { timeStart: number, timeFinish: number }[]);
    const [holidaysValue, setHolidaysValue] = useState([] as string[]);
    const [weekendsValue, setWeekendsValue] = useState([] as (DaysOfWeek | null)[]);
    const [workdaysValue, setWorkdaysValue] = useState([] as { date: string, timeStart: number, timeFinish: number }[]);

    useEffect(() => {
        //    если есть расписание 
        if (schedule.team) {
            setTimeStartWorkValue(schedule.timeStartWork);
            setTimeFinishWorkValue(schedule.timeFinishWork);
            setBreaksValue(schedule.breaks);
            setHolidaysValue(schedule.holidays);
            setWeekendsValue(schedule.weekends);
            setWorkdaysValue(schedule.workdays);
            setTimeZoneValue(schedule.timeZone);
        }
    }, []);

    // На сервере  // На клиенте
    const saveScheduleHandler = async () => {
        setMessage("");

        const schedule = {
            team: team as TeamItem,
            timeStartWork: timeStartWorkValue,
            timeFinishWork: timeFinishWorkValue,
            breaks: breaksValue,
            holidays: holidaysValue,
            weekends: weekendsValue,
            workdays: workdaysValue,
            timeZone: timeZoneValue
        } as ScheduleItem;

        await saveSchedule(schedule, team, user, token, dispatch, t, setMessage,
            setTimeStartWorkValue, setTimeFinishWorkValue, setBreaksValue,
            setHolidaysValue, setWeekendsValue, setWorkdaysValue,
            setTimeZoneValue, setModified);
    };
    // На клиенте
    const cancelScheduleHandler = () => {
        // setTeamValue(schedule.team.title);
        // setPrefixValue(schedule.team.prefix)
        setTimeStartWorkValue(schedule.timeStartWork);
        setTimeFinishWorkValue(schedule.timeFinishWork);
        setBreaksValue(schedule.breaks);
        setHolidaysValue(schedule.holidays);
        setWeekendsValue(schedule.weekends);
        setWorkdaysValue(schedule.workdays);
        setTimeZoneValue(schedule.timeZone);
        setModified(false);
    };

    // На клиенте
    const changeHandler = (value: string | number | TimeZoneEnum | null, field: string) => {

        switch (field) {

            case "timeStart":
                setTimeStartWorkValue(value as number);
                break;
            case "timeFinish":
                setTimeFinishWorkValue(value as number);
                break;

            case "timeZone":
                setTimeZoneValue(value as TimeZoneEnum);
                break;
            default:
                break;
        }

        setModified(true);
    };
    // На клиенте
    const changeRowHandler = (indexToChange: number, value: string | number | DaysOfWeek | null, field: string) => {

        switch (field) {
            // Доп рабочие дни
            case "workDayDate":
                {
                    if (value) {
                        const workday = workdaysValue[indexToChange];
                        const updatedworkday = { ...workday, date: value as string }
                        // let updatedworkday = { ...workday, date: value.toLocaleString().split(',')[0] }
                        const workdaysValueUpdated = [...workdaysValue]
                        workdaysValueUpdated.splice(indexToChange, 1, updatedworkday)
                        setWorkdaysValue(workdaysValueUpdated)
                    }
                }
                break;
            case "workTimeStart":
                {
                    const workday = workdaysValue[indexToChange];
                    const updatedworkday = { ...workday, timeStart: value as number }
                    const workdaysValueUpdated = [...workdaysValue]
                    workdaysValueUpdated.splice(indexToChange, 1, updatedworkday)
                    setWorkdaysValue(workdaysValueUpdated)

                }
                break;
            case "workTimeFinish":
                {
                    const workday = workdaysValue[indexToChange];
                    const updatedworkday = { ...workday, timeFinish: value as number }
                    const workdaysValueUpdated = [...workdaysValue]
                    workdaysValueUpdated.splice(indexToChange, 1, updatedworkday)
                    setWorkdaysValue(workdaysValueUpdated)

                }
                break;
            // дни недели
            case "weekDay":
                {
                    // let weekend = weekendsValue[indexToChange];
                    const weekend = value as DaysOfWeek | null;
                    const weekendsValueUpdated = [...weekendsValue]
                    weekendsValueUpdated.splice(indexToChange, 1, weekend)
                    setWeekendsValue(weekendsValueUpdated)
                }
                break;
            // Перерывы рабочих дней                
            case "breakTimeStart":
                {
                    const break_ = breaksValue[indexToChange];
                    const updatedbreak = { ...break_, timeStart: value as number }
                    const breaksValueUpdated = [...breaksValue]
                    breaksValueUpdated.splice(indexToChange, 1, updatedbreak)
                    setBreaksValue(breaksValueUpdated)

                }
                break;
            case "breakTimeFinish":
                {
                    const break_ = breaksValue[indexToChange];
                    const updatedbreak = { ...break_, timeFinish: value as number }
                    const breaksValueUpdated = [...breaksValue]
                    breaksValueUpdated.splice(indexToChange, 1, updatedbreak)
                    setBreaksValue(breaksValueUpdated)

                }
                break;
            case "holidayDate":
                {
                    if (value) {
                        // let updatedholiday = value.toLocaleString().split(',')[0];
                        const holidaysValueUpdated = [...holidaysValue]
                        holidaysValueUpdated.splice(indexToChange, 1, value as string)
                        setHolidaysValue(holidaysValueUpdated)
                    }
                }

            default:
                break;
        }

        setModified(true);

    };
    // На клиенте
    const deleteBreakHandler = (indexToRemove: number) => {
        const breaksValueUpdated = [...breaksValue]
        breaksValueUpdated.splice(indexToRemove, 1)
        setBreaksValue(breaksValueUpdated)
        setModified(true);
    };
    // На клиенте
    const deleteWeekendHandler = (indexToRemove: number) => {
        const weekendsValueUpdated = [...weekendsValue]
        weekendsValueUpdated.splice(indexToRemove, 1)
        setWeekendsValue(weekendsValueUpdated)
        setModified(true);
    };
    // На клиенте
    const deleteWorkdayHandler = (indexToRemove: number) => {
        const workdaysValueUpdated = [...workdaysValue]
        workdaysValueUpdated.splice(indexToRemove, 1)
        setWorkdaysValue(workdaysValueUpdated)
        setModified(true);
    };
    // На клиенте
    const deleteHolidayHandler = (indexToRemove: number) => {
        const holidaysValueUpdated = [...holidaysValue]
        holidaysValueUpdated.splice(indexToRemove, 1)
        setHolidaysValue(holidaysValueUpdated)
        setModified(true);
    };

    // На клиенте
    const addBreakHandler = () => {
        const newBreak = { timeStart: 0, timeFinish: 0 } as { timeStart: number, timeFinish: number };
        setBreaksValue([...breaksValue, newBreak])
        setModified(true);
    };
    // На клиенте
    const addWeekendHandler = () => {
        setWeekendsValue([...weekendsValue, null])
        setModified(true);
    };
    // На клиенте
    const addHolidayHandler = () => {
        const dateString = getCurrentDateInString(schedule.timeZone);
        const newHoliday = dateString.split(',')[0];
        // const newHoliday = new Date().toLocaleDateString("en-CA").split(',')[0];
        setHolidaysValue([...holidaysValue, newHoliday])
        setModified(true);
    };
    // На клиенте
    const addWorkdayHandler = () => {
        const newWorkday = { date: "", timeStart: 0, timeFinish: 0 } as { date: string, timeStart: number, timeFinish: number };
        setWorkdaysValue([...workdaysValue, newWorkday])
        setModified(true);
    };

    const breaksValueReactNodes = breaksValue.map((elem, index) => (
        (
            <tr key={index}>
                <td>
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteBreakHandler(index)}
                    />
                </td>

                <td >
                    <input
                        id={`timeStart-${index}`}
                        autoComplete="off"
                        value={elem.timeStart !== undefined
                            ? `${String(Math.floor(elem.timeStart / 60)).padStart(2, '0')}:${String(elem.timeStart % 60).padStart(2, '0')}`
                            : ""}


                        type="time"
                        onChange={e => {
                            const [hours, minutes] = e.target.value.split(":").map(Number);
                            const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                            changeRowHandler(index, totalMinutes, "breakTimeStart");

                        }}
                    />
                </td>
                <td  >
                    <input
                        id={`timeFinish-${index}`}
                        autoComplete="off"
                        value={elem.timeFinish !== undefined
                            ? `${String(Math.floor(elem.timeFinish / 60)).padStart(2, '0')}:${String(elem.timeFinish % 60).padStart(2, '0')}`
                            : ""}

                        type="time"
                        onChange={e => {
                            const [hours, minutes] = e.target.value.split(":").map(Number);
                            const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                            changeRowHandler(index, totalMinutes, "breakTimeFinish");
                        }}
                    />
                </td>

            </tr>
        )
    ))

    const selectedValues: DaysOfWeek[] = weekendsValue.filter(elem => elem !== null) as DaysOfWeek[];

    const weekendsValueReactNodes = weekendsValue.map((elem, index) => (
        (
            <tr key={index}>
                <td   >
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteWeekendHandler(index)}
                    />
                </td>

                <td >

                    <DropdownSelectWeekDay
                        onSelect={(value) => {
                            changeRowHandler(index, value, "weekDay");
                        }}
                        selectedValue={elem || null}
                        selectedValues={selectedValues}
                    />
                </td>
            </tr>

        )
    ))
    const workdaysValueReactNodes = workdaysValue.map((elem, index) => (
        (
            <tr key={index}>
                <td>
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteWorkdayHandler(index)}
                    />
                </td>
                <td>
                    <input
                        // className={styles.work_date}
                        id={`date-${index}`}
                        autoComplete="off"
                        value={elem.date ? new Date(elem.date).toLocaleDateString('en-CA') : ""}
                        type="date"
                        onChange={e => {
                            // const date = new Date(e.target.value);
                            // date.setHours(0, 0, 0, 0);
                            changeRowHandler(index, e.target.value, "workDayDate");
                        }}
                    />
                </td>
                <td>
                    <input
                        // className={styles.work_time}
                        id={`timeStart-${index}`}
                        autoComplete="off"
                        value={elem.timeStart !== undefined
                            ? `${String(Math.floor(elem.timeStart / 60)).padStart(2, '0')}:${String(elem.timeStart % 60).padStart(2, '0')}`
                            : ""}
                        type="time"
                        onChange={e => {
                            const [hours, minutes] = e.target.value.split(":").map(Number);
                            const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                            changeRowHandler(index, totalMinutes, "workTimeStart");
                        }}
                    />
                </td>
                <td>
                    <input
                        // className={styles.work_time}
                        id={`timeFinish-${index}`}
                        autoComplete="off"
                        value={elem.timeFinish !== undefined
                            ? `${String(Math.floor(elem.timeFinish / 60)).padStart(2, '0')}:${String(elem.timeFinish % 60).padStart(2, '0')}`
                            : ""}

                        type="time"
                        onChange={e => {
                            const [hours, minutes] = e.target.value.split(":").map(Number);
                            const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                            changeRowHandler(index, totalMinutes, "workTimeFinish");
                        }}
                    />
                </td>

            </tr>

        )
    ))
    const holidaysValueReactNodes = holidaysValue.map((elem, index) => (
        (
            <tr key={index}>
                <td>
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteHolidayHandler(index)}
                    />
                </td>

                <td >
                    <input
                        // className={styles.holiday_date}
                        id={`date-${index}`}
                        autoComplete="off"
                        value={elem ? (new Date(elem)).toLocaleDateString('en-CA') : ""}
                        type="date"
                        onChange={e => {
                            // const date = new Date(e.target.value);
                            // date.setHours(0, 0, 0, 0);
                            changeRowHandler(index, e.target.value, "holidayDate");

                        }}
                    />
                </td>
            </tr>

        )
    ))

    return (
        <div className={styles.container}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelScheduleHandler() }}
            />

            <div className={styles.field_container}>
                <div className={styles.title}>{t('teamSchedule.workHours')}</div>
                <div className={styles.time_container} >
                    <div className={styles.input_container}>
                        <div className={styles.title}>{t('teamSchedule.start')}</div>
                        <input
                            className={styles.time_input}
                            id="timeStart"
                            autoComplete="off"
                            value={timeStartWorkValue !== undefined
                                ? `${String(Math.floor(timeStartWorkValue / 60)).padStart(2, '0')}:${String(timeStartWorkValue % 60).padStart(2, '0')}`
                                : ""}
                            type="time"
                            onChange={e => {
                                setModified(true);
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                                changeHandler(totalMinutes, "timeStart");
                            }}
                        />
                    </div>
                    <div className={styles.input_container}>
                        <div className={styles.title}>{t('teamSchedule.finish')}</div>
                        <input
                            className={styles.time_input}
                            id="timeFinish"
                            autoComplete="off"
                            value={timeFinishWorkValue !== undefined
                                ? `${String(Math.floor(timeFinishWorkValue / 60)).padStart(2, '0')}:${String(timeFinishWorkValue % 60).padStart(2, '0')}`
                                : ""}
                            type="time"
                            onChange={e => {
                                setModified(true);
                                const [hours, minutes] = e.target.value.split(":").map(Number);
                                const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                                changeHandler(totalMinutes, "timeFinish");
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.field_container}>
                <div className={styles.title}>{t('teamSchedule.timeZone')}</div>
                <div className={styles.time_container} >
                    <DropdownSelectTimeZone
                        onSelect={(value) => {
                            changeHandler(value, "timeZone");
                        }}
                        selectedValue={timeZoneValue || null}
                    />
                </div>
            </div>
            <div className={styles.field_container}>
                <div className={styles.title}>{t('teamSchedule.breaks')}</div>
                <table className={styles._table}>
                    <thead>
                        <tr>
                            <th ></th>
                            <th >{t('teamSchedule.start')}</th>
                            <th >{t('teamSchedule.finish')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {breaksValueReactNodes}
                    </tbody>
                </table>
                <div className={styles.container_buttons_row_table}>
                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={add}
                            alt="arrow" width={20} height={20}
                            onClick={() => { addBreakHandler() }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.field_container}>
                <div className={styles.title}>{t('teamSchedule.weekends')}</div>
                <table className={styles._table}>
                    <thead>
                        <tr>
                            <th ></th>
                            <th >{t('teamSchedule.weekDay')}</th>

                        </tr>
                    </thead>
                    <tbody>
                        {weekendsValueReactNodes}
                    </tbody>
                </table >
                <div className={styles.container_buttons_row_table}>
                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={add}
                            alt="arrow" width={20} height={20}
                            onClick={() => { addWeekendHandler() }}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.field_container}>
                <div className={styles.title}>{t('teamSchedule.holidays')}</div>

                <table className={styles._table}>
                    <thead>
                        <tr>
                            <th ></th>
                            <th >{t('teamSchedule.date')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holidaysValueReactNodes}
                    </tbody>
                </table>
                <div className={styles.container_buttons_row_table}>
                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={add}
                            alt="arrow" width={20} height={20}
                            onClick={() => { addHolidayHandler() }}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.field_container}>
                <div className={styles.title}>{t('teamSchedule.additonalTime')}</div>
                <table className={styles._table}>
                    <thead>
                        <tr>
                            <th></th>
                            <th >{t('teamSchedule.date')}</th>
                            <th >{t('teamSchedule.start')}</th>
                            <th >{t('teamSchedule.finish')}</th>

                        </tr>
                    </thead>
                    <tbody>
                        {workdaysValueReactNodes}
                    </tbody>
                </table>
                <div className={styles.container_buttons_row_table}>
                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={add}
                            alt="arrow" width={20} height={20}
                            onClick={() => { addWorkdayHandler() }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.container_buttons_row}>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => { saveScheduleHandler() }}
                    />
                    {modified && <div>*</div>}
                </div>

            </div>


        </div>


    )
}