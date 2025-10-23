import { useEffect, useRef } from 'react';
import { UnitLoadItem, UnitExceptionItem, } from "@/types/types";

export const useResizeObserver = (
  ref: React.RefObject<HTMLElement>,
  onResize: () => void,
  delay = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onResize();
      }, delay);
    });

    observer.observe(ref.current);

    // вызов сразу
    onResize();

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [ref, onResize, delay]);
};

// ⚡️ Индекс: [date|unitId] -> UnitLoadItem[]
export const loadsByDateUnit = (
  unitLoads: UnitLoadItem[]
) => {
  const map = new Map<string, UnitLoadItem[]>();
  for (const lo of unitLoads) {
    const key = `${lo.date}|${lo.unit.id}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(lo);
  }
  // По желанию — сортируем один раз
  for (const arr of map.values()) arr.sort((a, b) => a.timeStart - b.timeStart);
  return map;
};

// ⚡️ Индекс: [date|unitId] -> UnitExceptionItem[]
export const exceptionsByDateUnit = (
  unitExceptions: UnitExceptionItem[]
) => {
  const map = new Map<string, UnitExceptionItem[]>();
  for (const ex of unitExceptions) {
    const key = `${ex.date}|${ex.unitId}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ex);
  }
  return map;
};

// ✅ Передаём классы объектом cls
// ШКАЛА Вычисление высоты интервалов в зависимости от масштаба
export function hourStyleFoo(
  scale: number,
  hours: number,
  minutes: number,
  cls: {
    interval4hours: string;
    interval1hour: string;
    interval30min: string;
    interval5min: string;
  }
): { hourStyle: string; hoursValue: string; minutesValue: string } {
  const show5Min = scale >= 70; // Показывать интервал 5 минут, если масштаб >= 200%
  const show30Min = scale >= 50; // Показывать интервал 30 минут, если масштаб >= 80%
  const show1Hour = scale >= 20; // Показывать часовые интервалы, если масштаб >= 30%
  const show4Hour = scale < 20;  // Показывать интервалы для 4 часов, если масштаб <30%

  {/* Визуализация интервалов */ }
  if (show4Hour && [0, 4, 8, 12, 16, 20].includes(hours) && minutes === 0)
    return { hourStyle: cls.interval4hours, hoursValue: String(hours), minutesValue: "" };

  if (show1Hour && minutes === 0)
    return {
      hourStyle: [0, 4, 8, 12, 16, 20].includes(hours) ? cls.interval4hours : cls.interval1hour,
      hoursValue: String(hours),
      minutesValue: ""
    };

  if (show30Min && minutes === 30)
    return { hourStyle: cls.interval30min, hoursValue: "", minutesValue: "" };

  if (show5Min && [0, 5, 10, 15, 20, 25, 35, 40, 45, 50, 55].includes(minutes))
    return { hourStyle: cls.interval5min, hoursValue: "", minutesValue: "" };

  return { hourStyle: "", hoursValue: "", minutesValue: "" };
}