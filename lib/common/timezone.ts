

import { TimeZoneEnum } from './../../types/types';
// Получить ключ enum по значению
export function getEnumKeyByValue<T extends Record<string, string>>(
  enumObj: T,
  value: string
): keyof T | undefined {
  return (Object.keys(enumObj) as (keyof T)[]).find(
    (k) => enumObj[k] === value
  );
}

// получение текущей даты в нужном часовом поясе  на выходе строка "YYYY-MM-DD"
export function getCurrentDateInString(timeZoneValue: string): string {

  const timeZone = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);

  const now = new Date();
  // отформатируем как yyyy-mm-dd
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;

  return `${y}-${m}-${d}`;
}
// получение текущей даты в нужном часовом поясе  на выходе дата Date
export function getCurrentDateInDate(timeZoneValue: string): Date {
  const timeZone = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);
  const now = new Date();

  // Получаем yyyy-mm-dd в нужной TZ
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;

  // Делаем строку "YYYY-MM-DDT00:00:00" (полночь в этой TZ)
  const iso = `${y}-${m}-${d}T00:00:00`;

  // Создаём Date → это UTC-время, эквивалентное полуночи в указанной TZ
  return new Date(iso);
}

// FIX: безопасное форматирование Date → "YYYY-MM-DD" в нужной TZ
export  function YYYYMMDDTZ(date: Date, timeZoneValue: string): string {
  
  const timeZone = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);

  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const d = parts.find(p => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

// // получение даты  из строки в нужном часовом поясе  на выходе дата Date на начало дня переданной даты
// export function getTimeZoneDateFromDateString(dateStr: string, timeZoneValue: string): Date {
//   const timeZone = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);
//   // Разбираем yyyy-mm-dd вручную
//   const [year, month, day] = dateStr.split('-').map(Number);

//   // Получаем смещение таймзоны для этой даты
//   const utcDate = new Date(Date.UTC(year, month - 1, day));

//   // Берём время в этой TZ (00:00 по локали)
//   const formatter = new Intl.DateTimeFormat('en-US', {
//     timeZone,
//     hour12: false,
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//   });

//   const parts = formatter.formatToParts(utcDate);
//   const y = parts.find(p => p.type === 'year')!.value;
//   const m = parts.find(p => p.type === 'month')!.value;
//   const d = parts.find(p => p.type === 'day')!.value;
//   const h = parts.find(p => p.type === 'hour')!.value;
//   const min = parts.find(p => p.type === 'minute')!.value;
//   const s = parts.find(p => p.type === 'second')!.value;

//   // Формируем ISO для UTC
//   return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`);
// }
// Возвращает Date = момент в UTC, соответствующий 00:00 в заданной TZ для yyyy-mm-dd

export function getTimeZoneDateFromDateString(dateStr: string, timeZoneValue: string): Date {
 
  const timeZone = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0); // 00:00 UTC этой даты

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  // Как выглядит момент utcMidnight в целевой TZ
  const parts = Object.fromEntries(dtf.formatToParts(new Date(utcMidnight)).map(p => [p.type, p.value]));
  const zonedAtUtcMidnight = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second)
  );

  const offsetMs = zonedAtUtcMidnight - utcMidnight; // смещение TZ относительно UTC в этот момент
  return new Date(utcMidnight - offsetMs);           // момент, когда в TZ было 00:00
}

// «Добавить N дней» в указанной тайм-зоне (работаем календарной датой зоны)
export const addDaysInZone = (date: Date, days: number, timeZoneValue: string): Date => {
  const timeZone = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);
  const ymd = date.toLocaleDateString('en-CA', { timeZone: timeZone }); // YYYY-MM-DD в зоне
  const utcMidnight = new Date(`${ymd}T00:00:00Z`);               // полуночь той даты (UTC-штамп)
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + days);        // +N дней по календарю
  return utcMidnight;                                             // дальше форматируй с { timeZone: tz }
};


// клиенские функции

export function getUserTimeZoneEnum(): TimeZoneEnum {
  const now = new Date();
  const userIana = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // шаг 1: если зона есть в enum
  if (userIana in TimeZoneEnum) {
    return TimeZoneEnum[userIana as keyof typeof TimeZoneEnum];
  }

  // шаг 2: вычисляем текущее смещение пользователя
  const userOffset = getOffsetMinutes(userIana, now);

  // ищем ближайший оффсет среди зон enum
  let bestKey: keyof typeof TimeZoneEnum = Object.keys(TimeZoneEnum)[0] as keyof typeof TimeZoneEnum;
  let bestDiff = Infinity;


  for (const key of Object.keys(TimeZoneEnum) as (keyof typeof TimeZoneEnum)[]) {
    const off = getOffsetMinutes(key, now);
    const diff = Math.abs(off - userOffset);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestKey = key;
    }
  }

  return TimeZoneEnum[bestKey];
}

// вспомогательный хелпер
function getOffsetMinutes(tzIana: string, at: Date): number {
  const s = new Intl.DateTimeFormat('en-US', {
    timeZone: tzIana,
    timeZoneName: 'shortOffset',
  }).format(at);

  const m = s.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1].startsWith('-') ? -1 : 1;
  const hh = Math.abs(parseInt(m[1], 10)) || 0;
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  return sign * (hh * 60 + mm);
}


// // пример
// console.log(getTodayDateInTimeZone("Europe/Riga"));
// console.log(getTodayDateInTimeZone("America/New_York"));

// // пример:
// console.log(getCurrentDate('Europe/Riga'));  // 2025-09-05
// console.log(getCurrentDate('Asia/Tokyo'));   // 2025-09-06 (в зависимости от времени)

// /** Локальная "сегодняшняя" дата команды как YYYY-MM-DD */
// export function teamTodayISODate(teamTz: string): string {
//   return DateTime.now().setZone(teamTz).toISODate(); // 'YYYY-MM-DD'
// }

// /** Превратить локальную дату команды в UTC-границы суток */
// export function dayBoundsUtc(localYYYYMMDD: string, teamTz: string) {
//   const startLocal = DateTime.fromISO(localYYYYMMDD, { zone: teamTz }).startOf('day');
//   const endLocal = startLocal.plus({ days: 1 });
//   return {
//     startUtc: startLocal.toUTC().toJSDate(), // Date в UTC
//     endUtc: endLocal.toUTC().toJSDate(),
//   };
// }

// /** Сравнить: попадает ли UTC-момент в локальный день команды */
// export function isUtcInTeamLocalDay(utcISO: string, localYYYYMMDD: string, teamTz: string): boolean {
//   const { startUtc, endUtc } = dayBoundsUtc(localYYYYMMDD, teamTz);
//   const t = DateTime.fromISO(utcISO, { zone: 'utc' }).toJSDate().getTime();
//   return t >= startUtc.getTime() && t < endUtc.getTime();
// }

// /** Нормализованное "текущее время" сервера, но как локальная дата команды */
// export function serverNowAsTeamLocalISODate(teamTz: string): string {
//   return DateTime.now().setZone(teamTz).toISODate();
// }

// /** Перевод локального datetime команды -> UTC ISO (для записи моментных полей) */
// export function localDateTimeToUtcISO(localISO: string, teamTz: string): string {
//   // localISO: 'YYYY-MM-DDTHH:mm' (или с секундами)
//   return DateTime.fromISO(localISO, { zone: teamTz }).toUTC().toISO();
// }
