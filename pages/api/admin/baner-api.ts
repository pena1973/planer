import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites'

import { BanerTable } from './../../../db/models/support/baners';
import { getBaner } from './../../../handlers/handlers-get';  // расчеты
import { setBaner } from './../../../handlers/handlers-update';  // расчеты
import { BanerItem } from '@/types/service-types'

interface RequestBody {
  baner: BanerItem,
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const banerRepository = getTypedRepository(db, 'BanerTable', BanerTable);

  try {

    const { teamId, userId } = req.query;

    switch (req.method) {
      case 'GET':
        const baner__ = await getBaner(
          teamId ? Number(teamId) : undefined,
          banerRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          baner: baner__,
          message: ""
        });

        break;
      case 'POST':
        const { baner } = req.body as RequestBody;
        const baner_ = await setBaner(baner, banerRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          baner: baner_,
          message: ""
        });

        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (baner-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)