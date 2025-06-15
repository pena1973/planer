

import { CalendarItem, UnitCalendarItem,UnitLoadItem, UnitBelongEnum, UnitExceptionItem, UnitItem, SettingsItem, ScheduleItem, DaysOfWeek, TCardItem, TimeTypeEnum } from "@/types";
import { UnitTable } from "../db/models/catalogs/units";

//  функция определяемт входит ли  дата в список дат дополнительного времени работы
const isAdditionalTime = (date: Date, schedule: ScheduleItem): boolean => {

  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  if (schedule.team)
  return schedule.workdays.some(workday =>
    new Date(workday.date).toLocaleDateString('en-CA').split(',')[0] === dateString
  ); else return false
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
  if (schedule.team) return schedule.weekends.includes(dayString);
  else return false
}
//  функция определяемт входит ли  дата в список праздниклв расписания
const isHoliday = (date: Date, schedule: ScheduleItem): boolean => {
  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  if (schedule.team)
  return schedule.holidays.some(holiday =>
    new Date(holiday).toLocaleDateString('en-CA').split(',')[0] === dateString
  ); else return false
}

// генерация привычной нам даты - ее использую как id дня
const idDay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');  // День с ведущим нулем
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Месяц с ведущим нулем
  const year = date.getFullYear();  // Год

  return `${day}.${month}.${year}`;  // Возвращаем строку в формате "день.месяц.год"
};

// генерация одного дня на шкале
const generateCalendarItem = (day: Date, schedule: ScheduleItem): CalendarItem => {
  const currentDate = new Date(day);  // Используем переданную дату для генерации одного элемента
  currentDate.setHours(0, 0, 0, 0);

  const _isWeekend = isWeekend(currentDate, schedule);  // День недели для учета выходных
  const _isHoliday = isHoliday(currentDate, schedule);  // День недели для учета Праздников
  const _isAdditionalTime = isAdditionalTime(currentDate, schedule);  // День недели для учета Праздников

  let timeStartWork = _isWeekend || _isHoliday ? 0 : schedule.timeStartWork;
  let timeFinishWork = _isWeekend || _isHoliday ? 0 : schedule.timeFinishWork;
  let breaks = _isWeekend || _isHoliday || (!schedule.team)? [] : [...schedule.breaks];

  if (_isAdditionalTime) {
    const workday = schedule.workdays.find(
      workday => workday.date === currentDate.toLocaleDateString("en-CA").split(',')[0]);
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
    idDay: idDay(currentDate),
    date: new Date(currentDate),  // Текущая дата
    mounth: currentDate.getDate() === 1,  // Если это первый день месяца, ставим true
    day: true,  // Указываем, что это день
    timeStartWork: timeStartWork,  // Время начала работы (если не выходной)
    timeFinishWork: timeFinishWork,  // Время окончания работы (если не выходной)
    breaks: breaks,
  };
  return calendarItem;  // Возвращаем один элемент календаря
};


// получение массива дней для списка юнитов с учеитом исключений 90  после даты и 90 дней до 
export const getUnitsSchedule = (
  today: string,           // формат "YYYY-MM-DD"
  schedule: ScheduleItem,
  exceptions: UnitExceptionItem[],
  units: UnitItem[]
): UnitCalendarItem[] => {
  const result: UnitCalendarItem[] = [];
  
  // Определяем диапазон: 90 дней до today и 90 дней после today
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 90);
  
  const endDate = new Date(today);
  endDate.setHours(0, 0, 0, 0);
  endDate.setDate(endDate.getDate() + 90);

  // Итерируем по дням диапазона
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Генерируем базовый CalendarItem для текущего дня (без учёта индивидуальных исключений)
    const calendarItem = generateCalendarItem(new Date(currentDate), schedule);
    
    // Для каждого юнита корректируем расписание с учетом его исключений
    for (const unit of units) {
      // Фильтруем исключения для данного юнита на текущую дату
      const unitExs = exceptions.filter(ex => 
        ex.unitId === unit.id &&
        ex.date === currentDate.toLocaleDateString("en-CA")
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
