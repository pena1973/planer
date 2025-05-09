import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { TCardTable } from '@/pages/db/models/data/t_cards';
import { getRepository } from 'typeorm';
import { getTCards, } from './handlers-get';  // 
import { StatusEnum } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) { 
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const tCardRepository = dbConnection.getRepository(TCardTable);
   
    // Извлекаем параметры userId и teamId из строки запроса
        const { userId, teamId:teamIdget } = req.query;
    
    switch (req.method) {
      case 'GET':    
      const statuses=[
        StatusEnum.defective, 
        StatusEnum.draft,
        StatusEnum.performed,
        StatusEnum.planed,
        StatusEnum.prepared,
        StatusEnum.ready]; // статусы для фильтрации
      
      const tCards = await getTCards(Number(teamIdget),statuses,tCardRepository)

        // // Строим фильтр для поиска
        // const filter: any = {};       
        // if (teamId) {
        //   filter.team_id = teamId;  // Фильтрация по team_id
        // }

        // // Выполняем запрос с фильтрацией
        // const tCards = await tCardRepository.find({
        //   where: filter,  // Применяем фильтр к запросу
        //   select: ['id', 'date', 'idc', 'coment', 'status'],  // Указываем, какие поля нужно вернуть
        // });

        
        // Возвращаем результат
        res.status(200).json({ success: true,tCards:tCards});
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (tcards-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
  
}



