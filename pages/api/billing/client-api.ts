import { withAuth } from '../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/translate/locale';
import { getTypedRepository } from '../../../db/utilites'

import { updateClient } from '../../../handlers/handlers-update';  // расчеты
import { ClientTable } from '../../../db/models/billing/clients';
import { ClientItem } from '../../../types/service-types';
import { getClient } from '../../../handlers/handlers-get';  // расчеты
import { updateStripeCustomerFromClient } from "./../payments/customer-update";

interface RequestBody {
  userId: number,
  teamId: number,
  client: ClientItem;
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const clientRepository = getTypedRepository(db, 'ClientTable', ClientTable);

  try {
    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'GET':
        const { teamId: getTeamId, userId: userIdget } = req.query;

        const client__ = await getClient(Number(userIdget), locale, Number(getTeamId), clientRepository)
        if (!client__) {
          // отправляем ответ
          res.status(200).json({
            success: false,
            message: "Данные клиента не найдены",
          });
        }
        // отправляем ответ
        res.status(200).json({
          success: true,
          client: client__,
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
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resClient.message });
          return;
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
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (client-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)