import { withAuth } from '../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getTypedRepository } from '../../../db/utilites'

import { updateClient } from '../../../handlers/handlers-update';  // расчеты
import { UOMsTable } from '../../../db/models/catalogs/uoms';
import { ClientTable } from '../../../db/models/billing/clients';
import { ClientItem } from '../../../types/service-types';
import { getClient } from '../../../handlers/handlers-get';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number,
  client: ClientItem;
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
    const clientRepository = getTypedRepository(db, 'ClientTable', ClientTable);

  try {

    const { teamId: getTeamId } = req.query;
    switch (req.method) {
      case 'GET':
        const client__ = await getClient(Number(getTeamId), clientRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          client: client__,
        });

        break;
      case 'POST':
        // Извлекаем данные из тела запроса
        const { client, userId, teamId } = req.body as RequestBody;


        const resClient = await updateClient(
          clientRepository,
          client,
          Number(teamId)
        )
        if (!resClient.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resClient.message });
          return;
        }

        const savedClient = resClient.savedClient as ClientTable;

        const client_ =  {
          id: savedClient.id,
          title: savedClient.title,
          reg_n: savedClient.reg_n,
          adress: savedClient.adress,
          email: savedClient.email,
          phone: savedClient.phone,
          person: savedClient.person,
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
    console.error('Ошибка подключения или выполнения запроса (uoms-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)