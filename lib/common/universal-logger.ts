import { LogLevelEnum, LogOriginEnum } from './../../types/service-types';
import type { LogPayload } from "./../../lib/server/logger-db"; // только тип — он стирается при компиляции

type Common = Omit<LogPayload, "origin" | "level"> & { level?: LogLevelEnum };

const isBrowser = typeof window !== "undefined";

// небольшая мапа enum -> имя метода
const levelToMethod = (l: LogLevelEnum) => {
  switch (l) {
    case LogLevelEnum.ERROR: return "error" as const;
    case LogLevelEnum.WARN: return "warn" as const;
    case LogLevelEnum.DEBUG: return "debug" as const;
    default: return "info" as const;
  }
};

async function write(level: LogLevelEnum, payload: Common) {
  if (isBrowser) {
    // ДИНАМИЧЕСКИЙ импорт только в браузере
    const { clientLogger } = await import("./../../lib/client/loggerClient");
    const method = levelToMethod(level);
    return clientLogger[method]({
      userId: payload.userId ?? null,
      location: payload.location,
      event: payload.event,
      message: payload.message,
      context: payload.context,
      requestId: payload.requestId ?? null,
    });
  } else {
    // ДИНАМИЧЕСКИЙ импорт только на сервере (Node)
    const { logToDB } = await import("./../../lib/server/logger-db");
    return logToDB({
      ...payload,
      origin: LogOriginEnum.SERVER,
      level,
    });
  }
}

export const ulogger = {
  info: (p: Common) => write(LogLevelEnum.INFO, p),
  warn: (p: Common) => write(LogLevelEnum.WARN, p),
  error: (p: Common) => write(LogLevelEnum.ERROR, p),
  debug: (p: Common) => write(LogLevelEnum.DEBUG, p),
};


// ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

// 7.1 Смена id при перезаписи (не должно быть для существующей записи)
// await ulogger.error({
//   userId: user?.id ?? null,
//   location: "services/plan/erazeCard.ts:45",
//   event: "id_mismatch",
//   message: `Попытка перезаписать существующую запись: oldId=${oldId}, newId=${newId}`,
//   context: { oldId, newId, tCardId },
// });

// 7.2 В catch блока при ошибке эндпойнта
// try {
//   // ...
// } catch (e) {
//   await ulogger.error({
//     userId: req.user?.id ?? null,
//     location: "pages/api/plan/pre-fullcardplan-api.ts",
//     event: "endpoint_error",
//     message: e instanceof Error ? e.message : String(e),
//     context: { stack: e instanceof Error ? e.stack : e, query: req.query },
//     requestId: req.headers["x-request-id"]?.toString() ?? null,
//   });
//   // ...
// }

// 7.3 Ошибка записи в dispatch (не то значение по типу)
// // на клиенте (React)
// await ulogger.warn({
//   userId: user?.id ?? null,
//   location: "components/UnitForm.tsx:120",
//   event: "dispatch_type_error",
//   message: "Попытка записать значение неправильного типа",
//   context: { expected: "number", got: typeof value, value },
// });