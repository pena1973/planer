import { withAuth } from '../../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from '../../../db/database';
import { getTypedRepository } from '../../../db/utilites'

import { BillTable } from '../../../db/models/billing/bills';
import { getBills } from '../../../handlers/handlers-get';
import { updateBill } from '../../../handlers/handlers-update';  // расчеты
import { BillRowTable } from '../../../db/models/billing/bill_row';
import { BillItem } from '../../../types/service-types';

interface RequestBody { bill: BillItem }

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const billsRepository = getTypedRepository(db, 'BillTable', BillTable);
  const billRowsRepository = getTypedRepository(db, 'BillRowTable', BillRowTable);

  try {

    const { teamId: getTeamId } = req.query;
    switch (req.method) {
      case 'GET':
        const bills__ = await getBills(Number(getTeamId), billsRepository)

        bills__.sort((a, b) => {
          // Проверяем, что id определено
          if (a.id === undefined || b.id === undefined) {
            return 0; // Если id не определено, оставляем элементы на своих местах
          }
          return a.id - b.id; // Сортировка по id
        });

        // отправляем ответ
        res.status(200).json({
          success: true,
          bills: bills__,
          message: ""
        });

        break;
      case 'POST':
        const { bill } = req.body as RequestBody;
        // создаем счет
        const savedBill = await updateBill(billsRepository, billRowsRepository, bill)

        // отправляем ответ
        res.status(200).json({
          success: true,
          bill: savedBill,
          message: ""
        });

        break;

      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (billing-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)