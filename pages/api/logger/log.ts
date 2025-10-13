import type { NextApiRequest, NextApiResponse } from "next";
import { logToDB } from "@/lib/server/logger-db";
import { LogLevelEnum, LogOriginEnum } from './../../../types/service-types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { level, userId, location, event, message, context, url, requestId } = req.body ?? {};

    // минимальная валидация
    if (!location || !event || !message) {
      return res.status(400).json({ ok: false, error: "location, event, message are required" });
    }

    await logToDB({
      level: (level as LogLevelEnum) ?? LogLevelEnum.INFO,
      origin: LogOriginEnum.CLIENT,
      userId: userId ?? null,
      location,
      event,
      message,
      context: context ?? null,
      url: url ?? null,
      requestId: requestId ?? null,
    });

    res.status(200).json({ success: true });

  } catch (e: unknown) {
    let message = "Ошибка api/log.";
    if (e instanceof Error) {
      message = `Ошибка api/log: ${e.message}`;
    }
    res.status(500).json({ success: false, error: message ?? "internal_error" });
  }
}
