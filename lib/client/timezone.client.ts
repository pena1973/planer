// lib/client/timezone.client.ts
import 'client-only'
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


////////////////////
// получение текущей даты (полночь) в указанной TZ, как Date-момент
// "текущее время в tzIana", но возвращаем Date так, чтобы локально показывало эти же часы/минуты
// формально  текущее время в указаной таймзоне а в редакторе всеравно покажет текущее на компе
export function getCurrentDateInDate(timeZoneValue: string): Date {
  const tzIana = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);

  // если у тебя value вида "Europe/Riga, UTC+2" — режем
  const iana = (tzIana ?? timeZoneValue).split(",")[0].trim();

  const now = new Date();

  // Берём компоненты времени "как в нужной TZ"
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: iana,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const y = Number(parts.find(p => p.type === "year")!.value);
  const m = Number(parts.find(p => p.type === "month")!.value);
  const d = Number(parts.find(p => p.type === "day")!.value);
  const hh = Number(parts.find(p => p.type === "hour")!.value);
  const mm = Number(parts.find(p => p.type === "minute")!.value);
  const ss = Number(parts.find(p => p.type === "second")!.value);

  // Создаём Date В ЛОКАЛЬНОЙ TZ, но с цифрами времени из нужной TZ
  // => в Watch ты увидишь "20:xx GMT+0300" (локально), но именно 20:xx — то, что ты хотела.
  return new Date(y, m - 1, d, hh, mm, ss, 0);
}

/////////////////////

// // получение текущей даты в нужном часовом поясе  на выходе дата Date
// export function getCurrentDateInDate(timeZoneValue: string): Date {
//   const timeZone = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);
//   const now = new Date();

//   // Получаем yyyy-mm-dd в нужной TZ
//   const parts = new Intl.DateTimeFormat('en-CA', {
//     timeZone,
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//   }).formatToParts(now);

//   const y = parts.find(p => p.type === 'year')?.value;
//   const m = parts.find(p => p.type === 'month')?.value;
//   const d = parts.find(p => p.type === 'day')?.value;

//   // Делаем строку "YYYY-MM-DDT00:00:00" (полночь в этой TZ)
//   const iso = `${y}-${m}-${d}T00:00:00`;

//   // Создаём Date → это UTC-время, эквивалентное полуночи в указанной TZ
//   return new Date(iso);
// }

// Возвращает Date = момент в UTC, соответствующий 00:00 в заданной TZ для yyyy-mm-dd
export function getTimeZoneDateFromDateString(dateStr: string, timeZoneValue: string): Date {
 
  const timeZone = getEnumKeyByValue(TimeZoneEnum, timeZoneValue);
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0); // 00:00 UTC этой даты

  const dtf = new Intl.DateTimeFormat('en-CA', {
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

// // вспомогательный хелпер
// function getOffsetMinutes(tzIana: string, at: Date): number {
//   const s = new Intl.DateTimeFormat('en-CA', {
//     timeZone: tzIana,
//     timeZoneName: 'shortOffset',
//   }).format(at);

//   const m = s.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
//   if (!m) return 0;
//   const sign = m[1].startsWith('-') ? -1 : 1;
//   const hh = Math.abs(parseInt(m[1], 10)) || 0;
//   const mm = m[2] ? parseInt(m[2], 10) : 0;
//   return sign * (hh * 60 + mm);
// }

// вспомогательный хелпер
function getOffsetMinutes(tzIana: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tzIana,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const tzPart = parts.find(p => p.type === "timeZoneName")?.value ?? "GMT+0";

  // ловим: GMT+2, GMT+02:00, GMT+2:00, GMT-05:30
  const m = tzPart.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return 0;

  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2]) || 0;
  const mm = m[3] ? Number(m[3]) : 0;

  return sign * (hh * 60 + mm);
}
