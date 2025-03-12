
import styles from "./сompanySchedule.module.scss";

import DropdownSelectWeekDay from "./DropdownSelectWeekDay/dropdownSelectWeekDay";
import DropdownSelectTimeZone from "./DropdownSelectTimeZone/dropdownSelectTimeZone";

import { DaysOfWeek, CompanyItem, ScheduleItem,TimeZoneEnum } from '@/types'
import Image from 'next/image';

import { useEffect, useState, useRef } from "react";

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setSchedule, } from '@/store/slices'

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface CompanyScheduleProps {
    setMessage: (message: string) => void
}

export default function CompanySchedule({ setMessage }: CompanyScheduleProps) {

    const dispatch = useAppDispatch();

    const schedule = useSelector((state: RootState) => {
        return state.catalogSlice.schedule;
    })


    const [modified, setModified] = useState(false); // при установке состояния происходит смена формы

    const [companyValue, setCompanyValue] = useState("");
    const [prefixValue, setPrefixValue] = useState("");
    const [timeZoneValue, setTimeZoneValue] = useState("");
    const [timeStartWorkValue, setTimeStartWorkValue] = useState(0);
    const [timeFinishWorkValue, setTimeFinishWorkValue] = useState(0);
    const [breaksValue, setBreaksValue] = useState([] as { timeStart: number, timeFinish: number }[]);
    const [holidaysValue, setHolidaysValue] = useState([] as string[]);
    const [weekendsValue, setWeekendsValue] = useState([] as (DaysOfWeek | null)[]);
    const [workdaysValue, setWorkdaysValue] = useState([] as { date: string, timeStart: number, timeFinish: number }[]);

    useEffect(() => {
        
        setCompanyValue(schedule.company.title);
        setPrefixValue(schedule.company.prefix)
        setTimeStartWorkValue(schedule.timeStartWork);
        setTimeFinishWorkValue(schedule.timeFinishWork);
        setBreaksValue(schedule.breaks);
        setHolidaysValue(schedule.holidays);
        setWeekendsValue(schedule.weekends);
        setWorkdaysValue(schedule.workdays);
        setTimeZoneValue(schedule.timeZone);
    }, []);

    // колбеки кнопки

    const saveScheduleHandler = async () => {
        setMessage("");
        let schedule = {
            company: { id: 1, title: companyValue, coment: "", prefix: prefixValue } as CompanyItem,
            timeStartWork: timeStartWorkValue,
            timeFinishWork: timeFinishWorkValue,
            breaks: breaksValue,
            holidays: holidaysValue,
            weekends: weekendsValue,
            workdays: workdaysValue,
            timeZone: timeZoneValue
        }

        // запрос на сохранение
        try {
            // запрос получение текста из БД вместе со словами     textId: number, userId:number
            const res = await fetch(`api/schedule-api?userId=${1}&companyId=${1}`,
                {
                    method: 'post',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        schedule: schedule,
                    }),
                }
            );
            if (res.status !== 200) {
                const receivedData = await res.json();
                let error = receivedData.error;
                setMessage(error);
                //  console.log(t('service.serverUnavailable') + res.status);
                // setMessage(t('service.serverUnavailable') + res.status);
            } else {
                const receivedData = await res.json();
                // console.log("receivedData", receivedData)

                if (receivedData.success) {
                    //   Обновим текущую карту
                    let schedule = receivedData.schedule as ScheduleItem
                    dispatch(setSchedule(schedule));
                    setCompanyValue(schedule.company.title);
                    setPrefixValue(schedule.company.prefix)
                    setTimeStartWorkValue(schedule.timeStartWork);
                    setTimeFinishWorkValue(schedule.timeFinishWork);
                    setBreaksValue(schedule.breaks);
                    setHolidaysValue(schedule.holidays);
                    setWeekendsValue(schedule.weekends);
                    setWorkdaysValue(schedule.workdays);
                    setTimeZoneValue(schedule.timeZone);
                    setModified(false);
                    setMessage("Обновлено расписание");
                } else setMessage(receivedData.error);
            }

        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
        }

        setModified(false);
    };

    const cancelScheduleHandler = () => {
        setCompanyValue(schedule.company.title);
        setPrefixValue(schedule.company.prefix)
        setTimeStartWorkValue(schedule.timeStartWork);
        setTimeFinishWorkValue(schedule.timeFinishWork);
        setBreaksValue(schedule.breaks);
        setHolidaysValue(schedule.holidays);
        setWeekendsValue(schedule.weekends);
        setWorkdaysValue(schedule.workdays);
        setTimeZoneValue(schedule.timeZone);
        setModified(false);
    };


    const changeHandler = (value: string | number|TimeZoneEnum|null, field: string) => {

        switch (field) {
            case "company":
                setCompanyValue(value as string);
            case "timeStart":
                setTimeStartWorkValue(value as number);
                break;
            case "timeFinish":
                setTimeFinishWorkValue(value as number);
                break;
            case "prefix":
                setPrefixValue(value as string);
                break;
            case "timeZone":
                setTimeZoneValue(value as TimeZoneEnum);
                break;                
            default:
                break;
        }

        setModified(true);
    };
    const changeRowHandler = (indexToChange: number, value: string | number  | DaysOfWeek | null, field: string) => {

        switch (field) {
            // Доп рабочие дни
            case "workDayDate":
                {if (value) {
                    let workday = workdaysValue[indexToChange];
                    let updatedworkday = { ...workday, date: value as string }
                    // let updatedworkday = { ...workday, date: value.toLocaleString().split(',')[0] }
                    let workdaysValueUpdated = [...workdaysValue]
                    workdaysValueUpdated.splice(indexToChange, 1, updatedworkday)
                    setWorkdaysValue(workdaysValueUpdated)}
                }
                break;
            case "workTimeStart":
                {
                    let workday = workdaysValue[indexToChange];
                    let updatedworkday = { ...workday, timeStart: value as number }
                    let workdaysValueUpdated = [...workdaysValue]
                    workdaysValueUpdated.splice(indexToChange, 1, updatedworkday)
                    setWorkdaysValue(workdaysValueUpdated)

                }
                break;
            case "workTimeFinish":
                {
                    let workday = workdaysValue[indexToChange];
                    let updatedworkday = { ...workday, timeFinish: value as number }
                    let workdaysValueUpdated = [...workdaysValue]
                    workdaysValueUpdated.splice(indexToChange, 1, updatedworkday)
                    setWorkdaysValue(workdaysValueUpdated)

                }
                break;
            // дни недели
            case "weekDay":
                {
                    // let weekend = weekendsValue[indexToChange];
                    let weekend = value as DaysOfWeek | null;
                    let weekendsValueUpdated = [...weekendsValue]
                    weekendsValueUpdated.splice(indexToChange, 1, weekend)
                    setWeekendsValue(weekendsValueUpdated)
                }
                break;
            // Перерывы рабочих дней                
            case "breakTimeStart":
                {
                    let break_ = breaksValue[indexToChange];
                    let updatedbreak = { ...break_, timeStart: value as number }
                    let breaksValueUpdated = [...breaksValue]
                    breaksValueUpdated.splice(indexToChange, 1, updatedbreak)
                    setBreaksValue(breaksValueUpdated)

                }
                break;
            case "breakTimeFinish":
                {
                    let break_ = breaksValue[indexToChange];
                    let updatedbreak = { ...break_, timeFinish: value as number }
                    let breaksValueUpdated = [...breaksValue]
                    breaksValueUpdated.splice(indexToChange, 1, updatedbreak)
                    setBreaksValue(breaksValueUpdated)

                }
                break;
            case "holidayDate":
                {if (value) {
                    // let updatedholiday = value.toLocaleString().split(',')[0];
                    let holidaysValueUpdated = [...holidaysValue]
                    holidaysValueUpdated.splice(indexToChange, 1, value as string)
                    setHolidaysValue(holidaysValueUpdated)
                }}

            default:
                break;
        }

        setModified(true);

    };

    const deleteBreakHandler = (indexToRemove: number) => {
        let breaksValueUpdated = [...breaksValue]
        breaksValueUpdated.splice(indexToRemove, 1)
        setBreaksValue(breaksValueUpdated)
        setModified(true);
    };
    const deleteWeekendHandler = (indexToRemove: number) => {
        let weekendsValueUpdated = [...weekendsValue]
        weekendsValueUpdated.splice(indexToRemove, 1)
        setWeekendsValue(weekendsValueUpdated)
        setModified(true);
    };
    const deleteWorkdayHandler = (indexToRemove: number) => {
        let workdaysValueUpdated = [...workdaysValue]
        workdaysValueUpdated.splice(indexToRemove, 1)
        setWorkdaysValue(workdaysValueUpdated)
        setModified(true);
    };
    const deleteHolidayHandler = (indexToRemove: number) => {
        let holidaysValueUpdated = [...holidaysValue]
        holidaysValueUpdated.splice(indexToRemove, 1)
        setHolidaysValue(holidaysValueUpdated)
        setModified(true);
    };


    const addBreakHandler = () => {
        let newBreak = { timeStart: 0, timeFinish: 0 } as { timeStart: number, timeFinish: number };
        setBreaksValue([...breaksValue, newBreak])
        setModified(true);
    };
    const addWeekendHandler = () => {
        setWeekendsValue([...weekendsValue, null])
        setModified(true);
    };
    const addHolidayHandler = () => {
        let newHoliday = new Date().toLocaleDateString("en-CA").split(',')[0];
        setHolidaysValue([...holidaysValue, newHoliday])
        setModified(true);
    };
    const addWorkdayHandler = () => {
        let newWorkday = {date:"", timeStart: 0, timeFinish: 0 } as { date: string, timeStart: number, timeFinish: number };
        setWorkdaysValue([...workdaysValue, newWorkday])
        setModified(true);
    };


    let breaksValueReactNodes = breaksValue.map((elem, index) => (
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
                        className={styles.breack_time}
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
                        className={styles.breack_time}
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
    let weekendsValueReactNodes = weekendsValue.map((elem, index) => (
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
                    />
                </td>
            </tr>

        )
    ))
    let workdaysValueReactNodes = workdaysValue.map((elem, index) => (
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
                        className={styles.work_date}
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
                        className={styles.work_time}
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
                        className={styles.work_time}
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
    let holidaysValueReactNodes = holidaysValue.map((elem, index) => (
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
                        className={styles.holiday_date}
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
        <div className={styles.container_schedule}>
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelScheduleHandler() }}
            />

            <div className={styles.field_container}>
                <div className={styles.title}>Компания</div>
                <input className={styles.company_input}
                    id={"company"}
                    autoComplete="off"
                    value={companyValue} type="text"
                    onChange={e => {
                        setModified(true);
                        changeHandler(e.target.value, "company")
                    }} />
                <div className={styles.prefix_container}>
                    <div className={styles.time_top}>Префикс</div>
                    <input className={styles.prefix_input}
                        id={"prefix"}
                        autoComplete="off"
                        maxLength={3}
                        value={prefixValue} type="text"
                        onChange={e => {
                            setModified(true);
                            changeHandler(e.target.value, "prefix")
                        }} />
                </div>
                <div className={styles.title}>Рабочие часы </div>
                <div className={styles.time_container} >
                    <div className={styles.input_container}>
                        <div className={styles.time_top}>Начало</div>
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
                        <div className={styles.time_top}>Конец</div>
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
                <div className={styles.title}>Перерывы рабочего дня</div>
                <table>
                    <thead>
                        <tr>
                            <th className={styles.icon_del_top}></th>
                            <th className={styles.time_top}>начало</th>
                            <th className={styles.time_top}>конец</th>
                        </tr>
                    </thead>
                    <tbody>
                        {breaksValueReactNodes}
                    </tbody>
                </table>
                <div className={styles.container_buttons_row}>
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
                <div className={styles.title}>Выходные</div>
                <table >
                    <tbody>
                        {weekendsValueReactNodes}
                    </tbody>
                </table >
                <div className={styles.container_buttons_row}>
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
                <div className={styles.title}>Праздники (даты)</div>
                <table >
                    <thead>

                    </thead>
                    <tbody>
                        {holidaysValueReactNodes}
                    </tbody>
                </table>
                <div className={styles.container_buttons_row}>
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
                <div className={styles.title}>Дополнительное рабочее время (даты и часы)</div>
                <table >
                    <thead>
                        <tr>
                            <th className={styles.icon_del_top}></th>
                            <th className={styles.date_top}>Дата</th>
                            <th className={styles.time_top}>Начало</th>
                            <th className={styles.time_top}>Конец</th>

                        </tr>
                    </thead>
                    <tbody>
                        {workdaysValueReactNodes}
                    </tbody>
                </table>
                <div className={styles.container_buttons_row}>
                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={add}
                            alt="arrow" width={20} height={20}
                            onClick={() => { addWorkdayHandler() }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.field_container}>
                <div className={styles.title}>Тайм зона</div>
                <DropdownSelectTimeZone
                    onSelect={(value) => {
                        changeHandler(value, "timeZone");
                    }}
                    selectedValue={timeZoneValue || null}
                />

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