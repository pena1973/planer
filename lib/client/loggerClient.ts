// import { sendClientLog } from "@/services/logger/logClient";

// import { LogLevelEnum } from './../../types/service-types';
// type Base = {
//   userId?: number | null;
//   location: string;
//   event: string;
//   message: string;
//   context?: unknown;
//   requestId?: string | null;
// };

// async function post(level: LogLevelEnum, base: Base) {
//   // локальная консоль — чтобы разработчику было видно сразу
//   const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] [client] [${base.location}] [${base.event}]`;
//   (level === LogLevelEnum.ERROR ? console.error : console.log)(prefix, base.message, base.context ?? "");

//   await sendClientLog({ ...base, level });
// }

// export const clientLogger = {
//   info: (base: Base) => post(LogLevelEnum.INFO, base),
//   warn: (base: Base) => post(LogLevelEnum.WARN, base),
//   error: (base: Base) => post(LogLevelEnum.ERROR, base),
//   debug: (base: Base) => post(LogLevelEnum.DEBUG, base),
// };

// // 💡 если хочешь жестко подменить console.log — делай это осознанно
// // включай только в dev-сборке, чтобы не ловить сайд-эффекты.
// export function patchConsoleLogForDev(enable = false) {
//   if (!enable || typeof window === "undefined") return;
//   const original = console.log;
//   console.log = (...args: any[]) => {
//     try {
//       const message = args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
//       clientLogger.info({
//         location: "console.log",
//         event: "console_log",
//         message,
//       });
//     } catch {
//       // игнор
//     }
//     original(...args);
//   };
// }

import { sendClientLog } from "@/services/logger/logClient";
import { LogLevelEnum } from "./../../types/service-types";

type Base = {
  userId?: number | null;
  location: string;
  event: string;
  message: string;
  context?: unknown;
  requestId?: string | null;
};

async function post(level: LogLevelEnum, base: Base): Promise<void> {
  // локальная консоль — чтобы разработчику было видно сразу
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] [client] [${base.location}] [${base.event}]`;
  (level === LogLevelEnum.ERROR ? console.error : console.log)(prefix, base.message, base.context ?? "");
  await sendClientLog({ ...base, level });
}

export const clientLogger = {
  info: (base: Base) => post(LogLevelEnum.INFO, base),
  warn: (base: Base) => post(LogLevelEnum.WARN, base),
  error: (base: Base) => post(LogLevelEnum.ERROR, base),
  debug: (base: Base) => post(LogLevelEnum.DEBUG, base),
};

// ——— utils ———
function normalizeArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

// 💡 Жёсткая подмена console.log — только в dev
export function patchConsoleLogForDev(enable = false): void {
  if (!enable || typeof window === "undefined") return;

  const originalLog: (...args: unknown[]) => void = console.log.bind(console);

  console.log = (...args: unknown[]): void => {
    try {
      const message = args.map(normalizeArg).join(" ");
      void clientLogger.info({
        location: "console.log",
        event: "console_log",
        message,
      });
    } catch {
      // ignore
    }
    originalLog(...args);
  };
}
