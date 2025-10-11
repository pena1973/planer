// pages/api/admin/mail-status-api.ts
// проверяет баланс у команд и деактивирует если баланса недостаточно  - запускается раз в день
import { ulogger } from "./../../../lib/common/universal-logger";

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { cnangeStatusMail } from './../../../handlers/handlers-update';  // расчеты

import { MailTable } from './../../../db/models/support/mails';
import { StatusEnum } from './../../../types/types';

interface RequestBody {
  mailId: number,
  status: string,
  userId: number
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const supportRepository = getTypedRepository(db, 'MailTable', MailTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'POST':

        // Извлекаем данные из тела запроса
        const { mailId, status, userId } = req.body as RequestBody;

        const statusEnum: StatusEnum = (() => {
          switch ((status ?? '').trim().toLowerCase()) {
            case 'prepared': return StatusEnum.prepared;
            case 'planed': return StatusEnum.planed;
            case 'performed': return StatusEnum.performed;
            case 'closed': return StatusEnum.closed;
            default: return StatusEnum.prepared;
          }
        })();

        // СПИСОК ДЕЙСТВИЙ 
        const resSupport = await cnangeStatusMail(
          Number(userId),
          locale,
          Number(mailId),
          statusEnum,
          supportRepository
        )
        if (!resSupport.success) {
          res.status(200).json({
            success: false,
            message: resSupport.message
          });
          break;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
        });
        break;
      default:
        res.status(405).json({ error: 'Method not supported.' });
    }
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/admin/mail-status-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)