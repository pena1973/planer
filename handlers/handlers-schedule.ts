
import { ulogger } from "./../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { CalendarItem, UnitCalendarItem, UnitExceptionItem, UnitItem, ScheduleItem, DaysOfWeek, TimeTypeEnum } from "./../types/types";
import { getTimeZoneDateFromDateString, addDaysInZone } from "./../lib/common/timezone"

import { YYYYMMDD, isHoliday, idDay, isWeekend, isAdditionalTime } from "@/lib/common/utils"

// генерация одного дня на шкале
const generateCalendarItem = (day: string, schedule: ScheduleItem): CalendarItem => {

  const _isWeekend = isWeekend(day, schedule);  // День недели для учета выходных
  const _isHoliday = isHoliday(day, schedule);  // День недели для учета Праздников
  const _isAdditionalTime = isAdditionalTime(day, schedule);  // День недели для учета Праздников

  let timeStartWork = _isWeekend || _isHoliday ? 0 : schedule.timeStartWork;
  let timeFinishWork = _isWeekend || _isHoliday ? 0 : schedule.timeFinishWork;
  let breaks = _isWeekend || _isHoliday || (!schedule.teamId) ? [] : [...schedule.breaks];

  if (_isAdditionalTime) {
    const workday = schedule.workdays.find(
      // workday => workday.date === currentDate.toLocaleDateString("en-CA").split(',')[0]);
      workday => workday.date === day);
    // если дата есть, то нужно просто взять дополнительное время из workday  
    if (workday) {
      if (_isWeekend || _isHoliday) {
        timeStartWork = workday.timeStart;
        timeFinishWork = workday.timeFinish;
      } else {
        timeStartWork = Math.min(schedule.timeStartWork, workday.timeStart)
        timeFinishWork = Math.max(schedule.timeFinishWork, workday.timeFinish);
      }
      //  проверим перерывы и если попадают в рабочий период вставим
      breaks = schedule.breaks.filter(breack => breack.timeStart > timeStartWork && breack.timeFinish < timeFinishWork)
    }
  }


  // Создаем объект CalendarItem

  const calendarItem: CalendarItem = {
    idDay: day,
    date: day,
    mounth: day.slice(8, 10) === "01",
    day: true,
    timeStartWork,
    timeFinishWork,
    breaks,
  };

  // const calendarItem: CalendarItem = {
  //   idDay: idDay(new Date(day)),
  //   // date: new Date(currentDate),  // Текущая дата
  //   date: day,  // Текущая дата
  //   // mounth: currentDate.getDate() === 1,  // Если это первый день месяца, ставим true
  //   mounth: new Date(day).getDate() === 1,  // Если это первый день месяца, ставим true
  //   day: true,  // Указываем, что это день
  //   timeStartWork: timeStartWork,  // Время начала работы (если не выходной)
  //   timeFinishWork: timeFinishWork,  // Время окончания работы (если не выходной)
  //   breaks: breaks,
  // };
  return calendarItem;  // Возвращаем один элемент календаря
};


// получение массива дней для списка юнитов с учеитом исключений 90  после даты и 90 дней до 
export const getUnitsSchedule = (
  userId: number,
  locale: string,
  today: string,           // формат "YYYY-MM-DD"
  schedule: ScheduleItem,
  exceptions: UnitExceptionItem[],
  units: UnitItem[]
): UnitCalendarItem[] => {
  const result: UnitCalendarItem[] = [];

  // Определяем диапазон: 90 дней до today и 90 дней после today
  // const startDate = new Date(today);
  // startDate.setHours(0, 0, 0, 0);
  let startDate = getTimeZoneDateFromDateString(today, schedule.timeZone)
  startDate = addDaysInZone(startDate, -90, schedule.timeZone)
  // startDate.setDate(startDate.getDate() - 90);

  // const endDate = new Date(today);  
  // endDate.setHours(0, 0, 0, 0);
  let endDate = getTimeZoneDateFromDateString(today, schedule.timeZone)
  endDate = addDaysInZone(endDate, 90, schedule.timeZone)
  // endDate.setDate(endDate.getDate() + 90);

  // Итерируем по дням диапазона
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Генерируем базовый CalendarItem для текущего дня (без учёта индивидуальных исключений)
    // const calendarItem = generateCalendarItem(currentDate.toLocaleDateString('en-CA'), schedule);
    const calendarItem = generateCalendarItem(YYYYMMDD(currentDate), schedule);

    // Для каждого юнита корректируем расписание с учетом его исключений
    for (const unit of units) {
      // Фильтруем исключения для данного юнита на текущую дату
      const unitExs = exceptions.filter(ex =>
        ex.unitId === unit.id &&
        // ex.date === currentDate.toLocaleDateString("en-CA")
        ex.date === YYYYMMDD(currentDate)
      );

      // Создадим копию CalendarItem для дальнейших корректировок
      const adjustedCalendarItem: CalendarItem = { ...calendarItem };

      // ПОПРАВИТЬ если интервал нот ворк скорректировать
      if (unitExs.length > 0) {
        // Если найдены исключения типа "not work" – считаем, что в этот день юнит не работает
        const notWorkEx = unitExs.find(ex => ex.type === TimeTypeEnum.notWork);
        if (notWorkEx) {
          adjustedCalendarItem.timeStartWork = 0;
          adjustedCalendarItem.timeFinishWork = 0;
          adjustedCalendarItem.breaks = [];
        } else {
          // Если есть исключения типа "work" – переопределяем рабочее время
          const workEx = unitExs.find(ex => ex.type === TimeTypeEnum.work);
          if (workEx) {
            adjustedCalendarItem.timeStartWork = workEx.timeStart;
            adjustedCalendarItem.timeFinishWork = workEx.timeFinish;
          }
          // Если есть исключения типа "breack" – корректируем перерывы
          const breakExs = unitExs.filter(ex => ex.type === TimeTypeEnum.breack);
          if (breakExs.length > 0) {
            // Например, заменяем стандартные перерывы на те, что заданы исключениями
            adjustedCalendarItem.breaks = breakExs.map(ex => ({
              timeStart: ex.timeStart,
              timeFinish: ex.timeFinish
            }));
          }
        }
      }

      // Создаем объект UnitCalendarItem для юнита с корректированным расписанием
      const unitCalendarItem: UnitCalendarItem = {
        ...adjustedCalendarItem,
        unit: unit
      };
      result.push(unitCalendarItem);
    }

    // Переходим к следующему дню
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
};
