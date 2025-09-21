/// проверяет баланс у команд и деактивирует если баланса недостаточно  - запускается раз в день
import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites'

import { cnangeStatusMail } from './../../../handlers/handlers-update';  // расчеты

import { MailTable } from './../../../db/models/support/mails';
import { StatusEnum } from './../../../types/types';

interface RequestBody {
  mailId: number,
  status: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const supportRepository = getTypedRepository(db, 'MailTable', MailTable);

  try {
    switch (req.method) {
      case 'POST':

        // Извлекаем данные из тела запроса
        const { mailId, status } = req.body as RequestBody;
        // status: string
       
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
          Number(mailId),
          statusEnum,
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