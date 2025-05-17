
import { CalendarItem, TCardContent,   ScheduleItem, DaysOfWeek, TCardItem, TimeTypeEnum } from "@/types";

export const fillGaps = (dataStart: number, loading: { name: string, start: number, finish: number }[]) => {
  let timeLScale = [] as { loaded: boolean, name: string, start: number, finish: number }[]
  // заполним пропуски
  // let dataStart = 0;
  for (let index = 0; index < loading.length; index++) {
    const element = loading[index];
    if (dataStart < element.start) {
      timeLScale.push({ loaded: false, name: "", start: dataStart, finish: element.start - 1 })
      dataStart = element.start;
      timeLScale.push({ loaded: true, name: element.name, start: dataStart, finish: element.finish })
      dataStart = element.finish + 1;
    } else if (dataStart = element.start) {
      timeLScale.push({ loaded: true, name: "", start: dataStart, finish: element.finish })
      dataStart = element.finish + 1;
    } else if (dataStart > element.start) {
      // Колизия
      timeLScale.push({ loaded: true, name: "Конфликт:" + element.name, start: dataStart, finish: element.finish })
      dataStart = element.finish + 1;
    }

  }
  return timeLScale;
}

export const ISOStringToLocalDateTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const localDateTimeToISOString = (localDateTime: string) => {
  const [datePart, timePart] = localDateTime.split('T');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  const localDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}`);
  return localDate.toISOString();

};

export function formatDateTime(date: Date) {
  // if {!date} return "";
  if (date instanceof Date && !isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0, поэтому добавляем 1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } else { return "" }

}

export function formatDate(date: Date) {
  if (date instanceof Date && !isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0, поэтому добавляем 1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } else { return "" }
}

export function padNumberToFourDigits(number: number): string {
  if (!number) return "new";
  if (number===0) return "new";
  return number.toString().padStart(4, '0');
}

export function convertMillisecondsToTime(ms: number): {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
} {
  const hours = Math.floor(ms / 3600000);
  const remainderAfterHours = ms % 3600000;
  const minutes = Math.floor(remainderAfterHours / 60000);
  const remainderAfterMinutes = remainderAfterHours % 60000;
  const seconds = Math.floor(remainderAfterMinutes / 1000);
  const milliseconds = remainderAfterMinutes % 1000;

  return { hours, minutes, seconds, milliseconds };
}

export function convertTimeToMilliseconds(hours: number, minutes: number, seconds: number, milliseconds: number): number {
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}
// конвертация минут во время
export function convertMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}-${minutes.toString().padStart(2, '0')}`;
}

// конвертация минут во время (формат 00 час 00 мин)
export function convertMinutesToTime1(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')} час ${minutes.toString().padStart(2, '0')} мин`;
}


// преобразование номера команды
export function generateTeamNumber(prefix: string, id: number): string {
  if (!id) return "";
  // Дополняем id нулями до 8 символов
  const formattedId = id.toString().padStart(8, '0');
  return `${prefix}${formattedId}`;
}
export function extractIdFromTeamNumber(teamNumber: string): number {
  // Извлекаем последние 8 символов, которые являются ID
  const idPart = teamNumber.slice(-8);
  return parseInt(idPart, 10);
}


export function generateUniqueIdc(): number {
  // Генерируем уникальное число на основе времени (в миллисекундах)
  const timestamp = Date.now();  // Текущее время в миллисекундах

  // Ограничиваем результат до 9 цифр (чтобы влезло в диапазон int)
  const uniqueInt = timestamp % 1000000000;  // Берем последние 9 цифр

  return uniqueInt;
}


export function generateUniqueId(): number {
  const timestamp = Date.now(); // Получаем текущее время в миллисекундах
  const randomFactor = Math.floor(Math.random() * 1000); // Добавляем случайное число для уникальности
  return timestamp + randomFactor;
}

///////////// PLANING /////////////

//  функция определяемт входит ли  дата в список выходных расписания
export const isWeekend = (date: Date, schedule: ScheduleItem): boolean => {
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
export const isHoliday = (date: Date, schedule: ScheduleItem): boolean => {
  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  if (schedule.team)
    return schedule.holidays.some(holiday =>
      new Date(holiday).toLocaleDateString('en-CA').split(',')[0] === dateString
    );
  else return false
}
//  функция определяемт входит ли  дата в список дат дополнительного времени работы
export const isAdditionalTime = (date: Date, schedule: ScheduleItem): boolean => {

  // Преобразуем переданную дату в строку в формате YYYY-MM-DD, чтобы сравнить только даты (без времени)
  const dateString = date.toLocaleDateString('en-CA').split(',')[0];

  // Проверяем, есть ли дата в массиве праздников
  if (schedule.team)
    return schedule.workdays.some(workday =>
      new Date(workday.date).toLocaleDateString('en-CA').split(',')[0] === dateString
    ); else return false
}

// генерация привычной нам даты - ее использую как id дня
export const idDay = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');  // День с ведущим нулем
  const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Месяц с ведущим нулем
  const year = date.getFullYear();  // Год

  return `${day}.${month}.${year}`;  // Возвращаем строку в формате "день.месяц.год"
};


// генерация одного дня на шкале
export const generateCalendarItem = (day: string|Date, schedule: ScheduleItem): CalendarItem => {

  const currentDate = new Date(day);  // Используем переданную дату для генерации одного элемента
  currentDate.setHours(0, 0, 0, 0);

  const _isWeekend = isWeekend(currentDate, schedule);  // День недели для учета выходных
  const _isHoliday = isHoliday(currentDate, schedule);  // День недели для учета Праздников
  const _isAdditionalTime = isAdditionalTime(currentDate, schedule);  // День недели для учета Праздников

  let timeStartWork = _isWeekend || _isHoliday ? 0 : schedule.timeStartWork;
  let timeFinishWork = _isWeekend || _isHoliday ? 0 : schedule.timeFinishWork;
  let breaks = _isWeekend || _isHoliday || (!schedule.team) ? [] : [...schedule.breaks];

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

//  ЧТЕНИЕ КАРТЫ ИЗ ФАЙЛА
export const calculateMaxIdc = (content: TCardContent): number => {
  let maxIdc = 0;

  // Проверяем tCardProducts
  if (content.tCardProducts) {
    content.tCardProducts.forEach((product) => {
      if (product.idc && product.idc > maxIdc) {
        maxIdc = product.idc;
      }
    });
  }

  // Проверяем tCardOperations
  if (content.tCardOperations) {
    content.tCardOperations.forEach((operation) => {
      if (operation.idc && operation.idc > maxIdc) {
        maxIdc = operation.idc;
      }
    });
  }

  // Проверяем tCardWastes
  if (content.tCardWastes) {
    content.tCardWastes.forEach((waste) => {
      if (waste.idc && waste.idc > maxIdc) {
        maxIdc = waste.idc;
      }
    });
  }

  // Проверяем tCardStages
  if (content.tCardStages) {
    content.tCardStages.forEach((stage) => {
      if (stage.idc && stage.idc > maxIdc) {
        maxIdc = stage.idc;
      }
    });
  }

  // Возвращаем максимальное значение
  return maxIdc;
};

export const validateFileContent = (content: TCardContent) => {
    const missingFields: string[] = [];
    const invalidFields: string[] = [];

    // Проверяем обязательные поля
    if (!content.date) missingFields.push("date");
    if (!content.idc) missingFields.push("idc");
    if (!Array.isArray(content.tCardProducts)) missingFields.push("tCardProducts");
    if (!Array.isArray(content.tCardOperations)) missingFields.push("tCardOperations");
    if (!Array.isArray(content.tCardStages)) missingFields.push("tCardStages");

    // Проверка на корректность значений
    if (content.tCardProducts) {
      content.tCardProducts.forEach((product, index) => {
        if (!product.code) invalidFields.push(`tCardProducts[${index}].code`);
        if (!product.title) invalidFields.push(`tCardProducts[${index}].title`);
        if (typeof product.qtu !== 'number') invalidFields.push(`tCardProducts[${index}].qtu`);
        if (!product.uom || !product.uom.code || !product.uom.title) invalidFields.push(`tCardProducts[${index}].uom`);
      });
    }

    if (content.tCardOperations) {
      content.tCardOperations.forEach((operation, index) => {
        if (!operation.idc) invalidFields.push(`tCardOperations[${index}].idc`);
        if (!operation.stage || !operation.stage.idc || !operation.stage.code) invalidFields.push(`tCardOperations[${index}].stage`);
        if (!Array.isArray(operation.out)) invalidFields.push(`tCardOperations[${index}].out`);
        if (!Array.isArray(operation.inn)) invalidFields.push(`tCardOperations[${index}].inn`);
      });
    }

    return { missingFields, invalidFields };
  };
