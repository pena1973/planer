import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';

import { TypeEnum } from '@/pages/db/models/enums';
import { TCardItem, TCardProductItem, TCardOperationItem, TCardStageItem, UnitLoadItem, StatusEnum } from '@/types';

interface RequestBody {
 
  operId: number,
  loadsIds: number[],
  status: StatusEnum,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(TeamTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    // userId, teamId в любом случае
    const { userId, teamId, tcardId } = req.query;

    switch (req.method) {
      case 'POST':

        // Извлекаем данные из тела запроса
        const { operId, loadsIds, status } = req.body as RequestBody;

        //Обновляем СТАТУС ОПЕРАЦИИ

        const resOperations = await updateStatusOperation(tCardOperationsRepository, operId, status)
        if (!resOperations.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOperations.message });
          return;
        }

        //Обновляем СТАТУС ЛОАДОВ этой версии планировангия

        const resLoads = await updateStatusOperationLoads(unitLoadRepository, loadsIds, status)
        if (!resLoads.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOperations.message });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
          message: 'Карта успешно обновлена',
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (tcard-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}


export async function updateStatusOperation(
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardId: number,
  status: StatusEnum
): Promise<{ success: boolean, message: string }> {
  try {    
    const result = await tCardOperationsRepository.update(tCardId, { status });
    if (result.affected && result.affected > 0) {
      return { success: true, message: "Операция успешно обновлена" };
    } else {
      return { success: false, message: "Операция не обновлена" };
    }
  } catch (error: any) {
    console.error("Ошибка обновления операции:", error);
    return { success: false, message: error.message || "Ошибка обновления операции" };
  }
}

// Функция для обновления статусов загрузок
export async function updateStatusOperationLoads(
  unitLoadRepository: Repository<UnitLoadTable>,
  loadsIds: number[],
  status: StatusEnum
): Promise<{ success: boolean, message: string }> {
  try {
   
    if (loadsIds.length === 0) {
      return { success: false, message: "Нет загрузок для обновления" };
    }

      const result = await unitLoadRepository
      .createQueryBuilder()
      .update(UnitLoadTable)
      .set({ status })
      .where("id IN (:...loadsIds)", { loadsIds })
      .execute();



    if (result.affected && result.affected > 0) {
      return { success: true, message: `Обновлено ${result.affected} загрузок` };
    } else {
      return { success: false, message: "Ни одна загрузка не обновлена" };
    }
  } catch (error: any) {
    console.error("Ошибка обновления статусов загрузок:", error);
    return { success: false, message: error.message || "Ошибка обновления статусов загрузок" };
  }
}
