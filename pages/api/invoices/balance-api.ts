import { withAuth } from './../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites'

import { updateClient } from './../../../handlers/handlers-update';  // расчеты

import { BalanceTable } from './../../../db/models/billing/balance';

import { getBalance } from './../../../handlers/handlers-get';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number,  
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  
  const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);

   try {

    const { teamId: getTeamId } = req.query;
    switch (req.method) {
      case 'GET':
        const balance_ = await getBalance(Number(getTeamId), balanceRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          balance: balance_,
        });

         break;
  //     case 'POST':
  //       // Извлекаем данные из тела запроса
  //       const { client, userId, teamId } = req.body as RequestBody;


  //       const resClient = await updateClient(
  //         clientRepository,
  //         client,
  //         Number(teamId)
  //       )
  //       if (!resClient.success) {
  //         res.status(500).json({ error: 'Не удалось обработать запрос. ' + resClient.message });
  //         return;
  //       }

  //       const savedClient = resClient.savedClient as ClientTable;

  //       const client_ =  {
  //         id: savedClient.id,
  //         title: savedClient.title,
  //         reg_n: savedClient.reg_n,
  //         adress: savedClient.adress,
  //         email: savedClient.email,
  //         phone: savedClient.phone,
  //         person: savedClient.person,
  //       };

  //       // отправляем ответ
  //       res.status(200).json({
  //         success: true,
  //         client: client_,
  //       });
  //       break;
  //     default:
  //       res.status(405).end(); // Метод не поддерживается
      }
   } catch (error) {
     console.error('Ошибка подключения или выполнения запроса (uoms-api):', error);
     res.status(500).json({ error: 'Не удалось обработать запрос' });
   }
}

export default withAuth(handler)