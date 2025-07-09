import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../lib/db/utils'

import { updateSupportMessage } from './../../handlers/handlers-update';  // расчеты

import { SupportTable } from './../../db/models/support/support';
import { SupportMessageItem } from './../../types/types';
import { getSuportMessages } from './../../handlers/handlers-get';

interface RequestBody {
  userId: number,
  teamId: number,
  supportMessage: SupportMessageItem;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
const db = await connectDb();
  const supportRepository = getTypedRepository(db, 'SupportTable', SupportTable);

  try {
  
    const { teamId: getTeamId } = req.query;
    switch (req.method) {
      case 'GET':
        const messages_ = await getSuportMessages(Number(getTeamId), supportRepository)

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
          Number(teamId),
          Number(userId),
          supportMessage,
          supportRepository

        )
        if (!resSupport.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resSupport.message });
          return;
        }

        const savedMessage = resSupport.savedMessage as SupportTable;

        const supportMessage_ = {
          id: savedMessage.id,
          date: new Date(savedMessage.date).toLocaleDateString('en-CA'),
          title: savedMessage.title,
          body: savedMessage.body,
          userId: savedMessage.user_id,
          fromUser: savedMessage.fromUser,
          basedOn: savedMessage.basedOn,
        } as SupportMessageItem

        // отправляем ответ
        res.status(200).json({
          success: true,
          supportMessage: supportMessage_,
        });
        break;
      // case 'DELETE':
      //   deleteSupport(idsToDelete, supportRepository)

      //   break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (support-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)