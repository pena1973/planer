//pages/api/admin/support-api.ts
// API для получения и обновления сообщений поддержки (support messages)
// Используется для отправки сообщений в поддержку и просмотра ответов 
import { ulogger } from "./../../../lib/common/universal-logger";

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { updateSupportMessage } from './../../../handlers/handlers-update';  // расчеты

import { MailTable } from './../../../db/models/support/mails';
import { SupportMailItem } from './../../../types/types';
import { getSuportMails } from './../../../handlers/handlers-get';

interface RequestBody {
  teamId: number, // кому уходит
  userId: number,
  supportMessage: SupportMailItem;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const supportRepository = getTypedRepository(db, 'MailTable', MailTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'GET':
        const { userId: userIdget } = req.query;

        //  получаю не указывая команду
        const messages_ = await getSuportMails(Number(userIdget), locale, null, supportRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          message: "",
          supportMessages: messages_,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { supportMessage, userId, teamId } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resSupport = await updateSupportMessage(
          Number(userId),
          locale,
          supportMessage,
          supportRepository
        )
        if (!resSupport.success) {
          res.status(200).json({
            success: false,
            message: resSupport.message,
          });
          break;
        }

        const savedMessage = resSupport.savedMessage as MailTable;

        const supportMessage_ = {
          id: savedMessage.id,
          date: savedMessage.date,
          title: savedMessage.title,
          body: savedMessage.body,
          userId: savedMessage.user_id,
          fromUser: savedMessage.fromUser,
          basedOn: savedMessage.basedOn,
          status: savedMessage.status
        } as SupportMailItem

        // отправляем ответ
        res.status(200).json({
          success: true,
          supportMessage: supportMessage_,
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
      location: "pages/api/admin/support-admin-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)