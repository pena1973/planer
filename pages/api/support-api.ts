import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/translate/locale';
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
  const db = await connectDb();
  const supportRepository = getTypedRepository(db, 'MailTable', MailTable);

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);


    switch (req.method) {

      case 'GET':
        const { teamId: getTeamId, userId: userIdget } = req.query;

        const messages_ = await getSuportMails(Number(userIdget), locale, Number(getTeamId), supportRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          message: "",
          supportMessages: messages_,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { supportMessage, userId } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resSupport = await updateSupportMessage(
          Number(userId),
          locale,
          supportMessage,
          supportRepository

        )
        if (!resSupport.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resSupport.message });
          return;
        }

        const savedMessage = resSupport.savedMessage as MailTable;

        const supportMessage_ = {
          id: savedMessage.id,
          // date: new Date(savedMessage.date).toLocaleDateString('en-CA'),
          date: savedMessage.date,
          title: savedMessage.title,
          body: savedMessage.body,
          userId: savedMessage.user_id,
          fromUser: savedMessage.fromUser,
          basedOn: savedMessage.basedOn,
          status: savedMessage.status,
        } as SupportMailItem

        // отправляем ответ
        res.status(200).json({
          success: true,
          supportMessage: supportMessage_,
        });
        break;

      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (support-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)