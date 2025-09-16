/// проверяет баланс у команд и деактивирует если баланса недостаточно  - запускается раз в день
import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites'

import { updateSupportMessage, markProcessedMail } from './../../../handlers/handlers-update';  // расчеты

import { SupportTable } from './../../../db/models/support/support';
import { SupportMailItem } from './../../../types/types';
import { getSuportMails } from './../../../handlers/handlers-get';

interface RequestBody {
  mailId: number, // кому уходит  
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const supportRepository = getTypedRepository(db, 'SupportTable', SupportTable);

  try {
    switch (req.method) {

      case 'POST':
        // Извлекаем данные из тела запроса
        const { mailId } = req.body as RequestBody;

        // СПИСОК ДЕЙСТВИЙ 
        const resSupport = await markProcessedMail(
          Number(mailId),
          supportRepository
        )
        if (!resSupport.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resSupport.message });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
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