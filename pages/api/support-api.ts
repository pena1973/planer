//pages/api/support-api.ts
// API для получения и обновления сообщений поддержки (support messages)
// Используется для отправки сообщений в поддержку и просмотра ответов 
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'

import { updateSupportMessage } from './../../handlers/handlers-update';  // расчеты

import { MailTable } from './../../db/models/support/mails';
import { SupportMailItem } from './../../types/types';
import { getSuportMails } from './../../handlers/handlers-get';


interface RequestBody {
  userId: number,
  teamId: number,
  supportMessage: SupportMailItem;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const supportRepository = getTypedRepository(db, 'MailTable', MailTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

    switch (req.method) {
      // получение сообщений поддержки для указанной команды
      case 'GET':
        const { teamId: getTeamId, userId: userIdget } = req.query;

        const messages = await getSuportMails(Number(userIdget), locale, Number(getTeamId), supportRepository)

        res.status(200).json({
          success: true,
          supportMessages: messages,
        });

        break;
      case 'POST':
        // запись сообщения поддержки
        const { supportMessage, userId } = req.body as RequestBody;

        const resSupport = await updateSupportMessage(
          Number(userId),
          locale,
          supportMessage,
          supportRepository
        )
        if (!resSupport.success) {
          res.status(200).json({
            success: false,
            message: resSupport.message
          });
          break;
        }

        const savedMessage_ = resSupport.savedMessage as MailTable;

        const savedMessage = {
          id: savedMessage_.id,
          date: savedMessage_.date,
          title: savedMessage_.title,
          body: savedMessage_.body,
          userId: savedMessage_.user_id,
          fromUser: savedMessage_.fromUser,
          basedOn: savedMessage_.basedOn,
          status: savedMessage_.status,
        } as SupportMailItem

        res.status(200).json({
          success: true,
          supportMessage: savedMessage,
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
      location: "pages/api/support-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)