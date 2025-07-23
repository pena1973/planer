import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../lib/db/utilites'

import { getTCardsTerms } from './../../handlers/handlers-get';  // 
import { TCardTable } from './../../db/models/data/t_cards'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'
import { TeamTable } from './../../db/models/catalogs/teams'
import { UnitLoadTable } from './../../db/models/plan/unit_loads';
import { StatusEnum } from './../../types/types';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const teamRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
  const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);

  try {    
    const { userId, teamId, tCardNumber, tCardDateFrom, tCardDateTo, tCardStatus } = req.query;
    
    // Проверяем, что tCardStatus является допустимым значением для StatusEnum
    const status = Object.values(StatusEnum).includes(tCardStatus as StatusEnum) ? tCardStatus as StatusEnum : undefined;

    switch (req.method) {
      case 'GET':

        // получаем карты с операциями
        const { tCardsTerms, loads } = await getTCardsTerms(
          Number(teamId),
          Number(tCardNumber),
          tCardDateFrom as string,
          tCardDateTo as string,
          status,
          tCardRepository,
          tCardOperationsRepository,
          // tCardProductRepository,
          unitLoadRepository
        )
        if (!tCardsTerms) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          tCards: tCardsTerms,
          unitLoadItems: loads,
          messsage: ""
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (report-tcards-state-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)
