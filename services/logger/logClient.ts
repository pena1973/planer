
import { LogLevelEnum } from "./../../types/service-types";

export type ClientLogOptions = {
  userId?: number | null;
  location: string;
  event: string;
  message: string;
  context?: unknown;
  level?: LogLevelEnum | keyof typeof LogLevelEnum; // "info" | ...
  requestId?: string | null;
};

export async function sendClientLog(opts: ClientLogOptions) {
  try {
    const body = {
      ...opts,
      level: typeof opts.level === "string" ? opts.level : opts.level ?? LogLevelEnum.INFO,
      url: typeof window !== "undefined" ? window.location?.href ?? null : null,
    };

    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true, // полезно при выгрузке страницы
    });
  } catch (err) {
    // если совсем плохо — хотя бы консоль
    console.error("Failed to send client log", err);
  }
}
