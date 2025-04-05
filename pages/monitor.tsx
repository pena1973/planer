import Layout from "@/components/Layout/layout";
import FileUploadButton from "@/components/FileUploadButton/fileUploadButton";
import UnitTaskStack from "@/components/monitor/UnitTaskStack/unitTaskStack";
import { ForwardButton, BackwardButton } from "@/components/monitor/ArrowButton/arrowButton";

// import Arrow1 from "@/components/Arrow1/arrow1";
import { useEffect, useState, useRef } from "react";
import Link from 'next/link';
import { ActionItem, UOMItem, UnitBelongEnum, UnitItem, ScheduleItem, DaysOfWeek } from '@/types'

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";


import {

} from '@/store/slices';
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
  const [resource, setResource] = useState(1); // 1 - загрузка юнитов, 2 - KPI, отчеты

  const [day, setDay] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    return date;
  });

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

  let unitsValueReactNodes = units
    .filter((elem) => elem.belong === UnitBelongEnum.inner)
    .map((elem, index) => {
      // фильтрую по юниту
      const unitLoads_ = unitLoads.filter((load) => {
        return (load.unit.id === elem.id && load.date === day.toLocaleDateString("en-CA"))
      });
      const unitExceptions_ = unitExceptions.filter((ex) => {
        return (ex.unitId === elem.id && ex.date === day.toLocaleDateString("en-CA"))
      });

      return <UnitTaskStack
        unit={elem}
        tCards={tCards}
        day={day.toLocaleDateString("en-CA")}
        unitLoads={unitLoads_}
        containerHeight={400}
        settings={settings}
        schedule={schedule}
        unitExceptions={unitExceptions_}
      />
    }
    )

  // Загрузка файла
  const onFileUpload = (content: UOMItem | ActionItem | UnitItem) => {
    // console.log('File uploaded with content:', content);
    // Дальнейшая обработка данных
  };

  return (
    <Layout>
      <div className="container" >
        <div className="container_left">
          <div className="container_left_inner">

            <div className="container_catalogs">
              <div className="resources_container_catalog" onClick={() => setResource(1)}>Загрузка юнитов</div>
              <div className="resources_container_catalog" onClick={() => setResource(2)}> KPI, Отчеты</div>

            </div>
            <div className="container_cards_title">Пояснение</div>
            <div className="container_message">{message}</div>
          </div>

          <FileUploadButton
            onFileUpload={onFileUpload}
            expectedInterface={{} as UOMItem} />

        </div>

        <div className="container_right">

          {/* Настройки */}
          {resource === 1 && <div className="contaitainer_catalog">

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
          {/* Действия */}
          {resource === 2 && <div className="contaitainer_catalog">
            <div className="catalog_title"> KPI, Отчеты</div>
            {/* <ActionsCatalog setMessage={setMessage}/> */}
          </div>}

        </div>

      </div>
    </Layout >
  )
}