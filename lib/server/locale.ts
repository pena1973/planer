// lib/server/messages/index.ts
// import ru from "./ru";
// import en from "./../../../en";

// 1) Простая функция получения локали из заголовка X-Lang.
//    Любое значение, начинающееся с "en" → en, иначе → ru.
export function getLocaleFromHeader(xLang: unknown): string {
  const raw = Array.isArray(xLang) ? xLang[0] : xLang;
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return s.startsWith("en") ? "en" : "ru";
}

// // 2) Словари без типов
// const dicts: Record<string, Record<string, string>> = { ru, en };

// // 3) Простой t(): берём из выбранного словаря → fallback на ru → иначе вернём сам key
// export function t(locale: string, key: string): string {
//   const dict = dicts[locale] || dicts.ru;
//   return dict[key] ?? dicts.ru[key] ?? key;
// }
