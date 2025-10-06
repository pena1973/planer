import { withAuth } from '../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from '../../../db/utilites'
import { InvoiceTable } from '../../../db/models/billing/invoice';
import { getInvoices } from '../../../handlers/handlers-get';




const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const invoicesRepository = getTypedRepository(db, 'InvoiceTable', InvoiceTable);

  try {
    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'GET':

        const { teamId: getTeamId, userId: userIdget } = req.query;

        const invoices = await getInvoices(Number(userIdget), locale, Number(getTeamId), invoicesRepository)

        invoices.sort((a, b) => {
          // Проверяем, что id определено
          if (a.id === undefined || b.id === undefined) {
            return 0; // Если id не определено, оставляем элементы на своих местах
          }
          return a.id - b.id; // Сортировка по id
        });

        // отправляем ответ
        res.status(200).json({
          success: true,
          invoices: invoices,
          message: ""
        });

        break;
      // 

      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (invoice-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)