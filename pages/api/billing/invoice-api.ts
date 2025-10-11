//pages/api/template-api.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from './../../../lib/server/i18n.server';


import { withAuth } from '../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from '../../../db/utilites'
import { InvoiceTable } from '../../../db/models/billing/invoice';
import { getInvoices } from '../../../handlers/handlers-get';


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const invoicesRepository = getTypedRepository(db, 'InvoiceTable', InvoiceTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

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
        location: "pages/api/billing/invoice-api",
        event: "api_error",
        message: `catch: ${error}`,
        context: "",
      }).catch(() => { console.error("logger error") });
      res.status(500).json({ error: `${error}` });
    }
}

export default withAuth(handler)