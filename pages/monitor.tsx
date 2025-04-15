import Layout from "@/components/Layout/layout";
import FileUploadButton from "@/components/FileUploadButton/fileUploadButton";
import UnitTaskStackProcess from "@/components/monitor/UnitTaskStackProcess/unitTaskStackProcess";
import UnitTaskStackControl from "@/components/monitor/UnitTaskStackControl/unitTaskStackControl";
import UnitTaskStackOutsource from "@/components/monitor/UnitTaskStackOutsource/unitTaskStackOutsource";
import ReportTCardState from "@/components/monitor/ReportTCardState/reportTCardState";
import ReportUnitsKPI from "@/components/monitor/ReportUnitsKPI/reportUnitsKPI";

import { ForwardButton, BackwardButton } from "@/components/monitor/ArrowButton/arrowButton";

// import Arrow1 from "@/components/Arrow1/arrow1";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { ActionItem, UOMItem, UnitBelongEnum, UnitItem, ScheduleItem, DaysOfWeek, UnitLoadItem, StatusEnum, UnitTypeEnum } from '@/types'

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";


import { setUnitLoads, setMonitorPoint } from '@/store/slices';
import { Index } from "typeorm";
import { get } from "http";


const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");
//  функция определяемт входит ли  дата в список дат дополнительного времени работы
const isAdditionalTime = (date: Date, schedule: ScheduleItem): boolean => {

  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  return schedule.workdays.some(workday =>
    new Date(workday.date).toLocaleDateString('en-CA').split(',')[0] === dateString
  );
}
//  функция определяемт входит ли  дата в список выходных расписания
const isWeekend = (date: Date, schedule: ScheduleItem): boolean => {
  const dayOfWeek = date.getDay();  // Получаем день недели (0 - воскресенье, 6 - суббота)    

  let dayString = DaysOfWeek.SUNDAY;

  switch (dayOfWeek) {
    case 1:
      dayString = DaysOfWeek.MONDAY;
      break;
    case 2:
      dayString = DaysOfWeek.TUESDAY;
      break;
    case 3:
      dayString = DaysOfWeek.WEDNESDAY;
      break;
    case 4:
      dayString = DaysOfWeek.THURSDAY;
      break;
    case 5:
      dayString = DaysOfWeek.FRIDAY;
      break;
    case 6:
      dayString = DaysOfWeek.SATURDAY;
      break;
    default:
      dayString = DaysOfWeek.SUNDAY;
      break;
  }

  // Проверяем, является ли день выходным
  return schedule.weekends.includes(dayString);
}
//  функция определяемт входит ли  дата в список праздниклв расписания
const isHoliday = (date: Date, schedule: ScheduleItem): boolean => {
  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  return schedule.holidays.some(holiday =>
    new Date(holiday).toLocaleDateString('en-CA').split(',')[0] === dateString
  );
}
interface MonitorProps {

}

export default function Monitor({ }: MonitorProps) {

  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  // const [resource, setResource] = useState(1); // 1 - загрузка юнитов, 2 - KPI, отчеты

  const [day, setDay] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    return date;
  });

  const monitorPoint = useSelector((state: RootState) => {
    return state.viewSlice.monitorPoint;
  })

  const units = useSelector((state: RootState) => {
    return state.catalogSlice.units;
  })
  const unitLoads = useSelector((state: RootState) => {
    return state.planSlice.unitLoads;
  })
  const settings = useSelector((state: RootState) => {
    return state.catalogSlice.settings;
  })
  const schedule = useSelector((state: RootState) => {
    return state.catalogSlice.schedule;
  })
  const unitExceptions = useSelector((state: RootState) => {
    return state.planSlice.unitExceptions;
  })
  const tCards = useSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })

  useEffect(() => {
    // Пока новая дата является выходным или праздником и нет дополнительного времени,
    // продолжаем увеличивать дату.
    let day_ = new Date(day);
    while ((isWeekend(day_, schedule) || isHoliday(day_, schedule)) && !isAdditionalTime(day_, schedule)) {

      day_.setDate(day_.getDate() + 1);
    }
    setDay(day_)
  }, []);

  //  меняем статус операции и лоадов
  const setStatusLoadsHandler = async (status: StatusEnum, operloadsIds: number[]) => {
    const unitLoads_ = unitLoads.map(lo => operloadsIds.includes(lo.id as number) ? { ...lo, status: status } : lo);
    dispatch(setUnitLoads(unitLoads_));
  }


  //  временные границы операции по лоаду
  const getStartFinishOper = (load: UnitLoadItem)
    : { start: { date: string, time: number }, finish: { date: string, time: number } } => {

    if (!load.id) return { start: { date: "", time: 0 }, finish: { date: "", time: 0 } };

    const loads = unitLoads.filter((elem) =>
      elem.id_oper === load.id_oper
      && elem.status === load.status //  потом можно будет убрать  связь будет по version
      && !elem.isRetool
      && elem.version === load.version
    ) // все лоады операции

    if (loads.length === 0) return { start: { date: "", time: 0 }, finish: { date: "", time: 0 } };

    let earliestLoad = loads[0];
    let latestLoad = loads[0];

    for (const load of loads) {
      // Для earliest: если дата меньше или, при равных датах, время старта меньше
      if (load.date < earliestLoad.date || (load.date === earliestLoad.date && load.timeStart < earliestLoad.timeStart)) {
        earliestLoad = load;
      }
      // Для latest: если дата больше или, при равных датах, время завершения больше
      if (load.date > latestLoad.date || (load.date === latestLoad.date && load.timeFinish > latestLoad.timeFinish)) {
        latestLoad = load;
      }
    }
    return {
      start: { date: earliestLoad.date, time: earliestLoad.timeStart },
      finish: { date: latestLoad.date, time: latestLoad.timeFinish }
    };
  }

  let unitsValueReactNodes = units
    .filter((elem) => elem.belong === UnitBelongEnum.inner)
    .map((unit, index) => {
      // фильтрую по юниту
      const unitLoads_ = unitLoads.filter((load) => {
        return (load.unit.id === unit.id && load.date === day.toLocaleDateString("en-CA"))
      });
      const unitExceptions_ = unitExceptions.filter((ex) => {
        return (ex.unitId === unit.id && ex.date === day.toLocaleDateString("en-CA"))
      });
      // юниты работники
      if (unit.type === UnitTypeEnum.process) {
        return <UnitTaskStackProcess
          unit={unit}
          tCards={tCards}
          day={day.toLocaleDateString("en-CA")}
          unitLoads={unitLoads_}
          containerHeight={400}
          settings={settings}
          schedule={schedule}
          unitExceptions={unitExceptions_}
          setMessage={setMessage}
          getStartFinishOper={getStartFinishOper}
          setStatusLoadsHandler={setStatusLoadsHandler}
        />
      }

      // юниты контролеры используется только если включен контроль качества в настройках
      if (settings.isQualControl && unit.type === UnitTypeEnum.control) {
        const performedLoads = unitLoads.filter((lo) => lo.status === StatusEnum.performed);

        return <UnitTaskStackControl
          unit={unit}
          tCards={tCards}
          day={day.toLocaleDateString("en-CA")}
          performedLoads={performedLoads}
          containerHeight={400}
          setMessage={setMessage}
          getStartFinishOper={getStartFinishOper}
          setStatusLoadsHandler={setStatusLoadsHandler}
          isQualControl={settings.isQualControl}
        />

      }
    }
    )

  const outerLoads = unitLoads.filter((lo) => lo.unit.belong === UnitBelongEnum.outer && lo.status === StatusEnum.planed);

  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">          
          <div className="container_catalogs">
            <div className="resources_container_catalog" onClick={() => dispatch(setMonitorPoint(1))}>Загрузка юнитов</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setMonitorPoint(2))}>Операции на стороне</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setMonitorPoint(3))}>Готовность карт</div>
            <div className="resources_container_catalog" onClick={() => dispatch(setMonitorPoint(4))}>KPI рабочих юнитов</div>

          </div>
          <div className="container_cards_title">Пояснение</div>
          <div className="container_global_message">{message}</div>

        </div>

        <div className="container_global_right">

          {/* Настройки */}
          {monitorPoint === 1 && <div className="container_monitor">

            <div className="catalog_title"> Загрузка юнитов</div>
            <div className="monitor_container_navigation">
              <BackwardButton onClick={() => {
                let newDate = new Date(day);
                newDate.setDate(newDate.getDate() - 1);
                // Пока новая дата является выходным или праздником и нет дополнительного времени,
                // продолжаем уменьшать дату.
                while ((isWeekend(newDate, schedule) || isHoliday(newDate, schedule)) && !isAdditionalTime(newDate, schedule)) {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setDay(newDate);
              }} />

              {day.toLocaleDateString("en-CA")}

              <ForwardButton onClick={() => {
                let newDate = new Date(day);
                newDate.setDate(newDate.getDate() + 1);
                // Пока новая дата является выходным или праздником и нет дополнительного времени,
                // продолжаем увеличивать дату.
                while ((isWeekend(newDate, schedule) || isHoliday(newDate, schedule)) && !isAdditionalTime(newDate, schedule)) {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setDay(newDate);
              }} />

            </div>
            <div className="monitor_container">{unitsValueReactNodes}</div>
          </div>}
          {/* состояние операций на outsource */}
          {monitorPoint === 2 && <div className="container_monitor">
            <div className="catalog_title"> Операции переданные сторонним исполнителям</div>
            <UnitTaskStackOutsource
              outerLoads={outerLoads}
              tCards={tCards}
              setMessage={setMessage}
              getStartFinishOper={getStartFinishOper}
              setStatusLoadsHandler={setStatusLoadsHandler} />
          </div>}
          {/* Готовность карт */}
          {monitorPoint === 3 && <div className="container_monitor">
            <div className="catalog_title"> Готовность карт</div>
            <ReportTCardState setMessage={setMessage} />
          </div>}
          {monitorPoint === 4 && <div className="container_monitor">
            <div className="catalog_title"> KPI рабочих юнитов</div>
            <ReportUnitsKPI setMessage={setMessage} />
          </div>}
        </div>

      </div>
    </Layout >
  )
}