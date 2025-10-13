//pages/api/units-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from '../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from '../../../db/utilites'

import { updateClient } from '../../../handlers/handlers-update';
import { getClient } from '../../../handlers/handlers-get';

import { ClientTable } from '../../../db/models/billing/clients';
import { ClientItem } from '../../../types/service-types';

import { updateStripeCustomerFromClient } from "./../payments/customer-update";

interface RequestBody {
  userId: number,
  teamId: number,
  client: ClientItem;
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const clientRepository = getTypedRepository(db, 'ClientTable', ClientTable);


    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'GET':
        const { teamId: getTeamId, userId: userIdget } = req.query;

        const clientGet = await getClient(Number(userIdget), locale, Number(getTeamId), clientRepository)
        if (!clientGet) {
          // отправляем ответ
          res.status(200).json({
            success: false,            
            message: `${t('mes.clientDataNotFound')}`,
          });
        }
        // отправляем ответ
        res.status(200).json({
          success: true,
          client: clientGet,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { client, userId, teamId } = req.body as RequestBody;

        // обновляем в стайпе или делаем нового
        const customerId = await updateStripeCustomerFromClient(client);

        const resClient = await updateClient(
          Number(userId),
          locale,
          clientRepository,
          { ...client, customerId: customerId ?? "" },
          Number(teamId)
        )
        if (!resClient.success) {

          res.status(200).json({
            success: false,
            message: resClient.message,
          });
          break;
        }

        const savedClient = resClient.savedClient as ClientTable;

        const client_ = {
          id: savedClient.id,
          title: savedClient.title,
          reg_n: savedClient.reg_n,
          address_line1: savedClient.address_line1,
          address_line2: savedClient.address_line2,
          city: savedClient.city,
          postal_code: savedClient.postal_code,
          email: savedClient.email,
          phone: savedClient.phone,
          country: savedClient.country,
          customerId: savedClient.customer_id,
        };

        // отправляем ответ
        res.status(200).json({
          success: true,
          client: client_,
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
      location: "pages/api/billing/client-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)