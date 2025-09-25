import { AppDataSource } from "@/db/data-source";
import { SystemLogTable } from './../../db/models/logger/logger'
import { LogLevelEnum, LogOriginEnum } from './../../types/service-types';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../db/utilites'

export type LogPayload = {
  level?: LogLevelEnum;
  origin?: LogOriginEnum; // по умолчанию server
  userId?: number | null;
  location: string;
  event: string;
  message: string;
  context?: unknown;
  url?: string | null;
  requestId?: string | null;
};

export async function logToDB(payload: LogPayload) {
  const db = await connectDb();
  const systemLogRepository = getTypedRepository(db, 'SystemLogTable', SystemLogTable);

  const {
    level = LogLevelEnum.INFO,
    origin = LogOriginEnum.SERVER,
    userId = null,
    location,
    event,
    message,
    context = null,
  } = payload;

  // лог в консоль — чтобы не слепой сервер
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${origin}] [${location}] [${event}]`;
  (level === LogLevelEnum.ERROR ? console.error : console.log)(prefix, message, context ?? "");

  try {

    const log = systemLogRepository.create({
      level,
      origin,
      user_id: userId,
      location,
      event,
      message,
      context,
    });

    await systemLogRepository.save(log);
  } catch (err) {
    console.error("⚠️ Failed to save log:", err);
  }
}
