import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { updateUOMS } from './handlers-update';  // расчеты

import { UOMsTable } from '@/pages/db/models/catalogs/uoms';
import { Code, Repository } from 'typeorm';
import { UOMItem } from '@/types';
import { getUOMs } from './handlers-get';  // расчеты

interface RequestBody {
  userId:number,
  teamId:number,
  uoms: UOMItem[];
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const uomsRepository = dbConnection.getRepository(UOMsTable);

    const {teamId:getTeamId } = req.query;
    switch (req.method) {
      case 'GET':
        const uoms__ = await getUOMs(Number(getTeamId),uomsRepository)
      
        uoms__.sort((a, b) => {
          // Проверяем, что id определено
          if (a.id === undefined || b.id === undefined) {
            return 0; // Если id не определено, оставляем элементы на своих местах
          }
          return a.id - b.id; // Сортировка по id
        });

       // отправляем ответ
       res.status(200).json({
         success: true,
         uoms: uoms__,
       });

       break;
       case 'POST':
         // Извлекаем данные из тела запроса
               const { uoms, userId, teamId } = req.body as RequestBody;
       
               // СПИСОК ДЕЙСТВИЙ 
               const resUOMS = await updateUOMS(
                 uomsRepository,
                 uoms,
                 Number(teamId)
               )
               if (!resUOMS.success) {
                 res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUOMS.message });
                 return;
               }
       
               const savedUOMs = resUOMS.savedUOMS as UOMsTable[];
       
               const uoms_ = savedUOMs
                 .map(uom => {
                   return {
                     id: uom.id,
                     title: uom.title,
                     code:uom.code
                   };
                 });
       
               // отправляем ответ
               res.status(200).json({
                 success: true,
                 uoms: uoms_,
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