import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { TCardTable } from '@/pages/db/models/data/t_cards';
import { getRepository } from 'typeorm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) { 
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const tCardRepository = dbConnection.getRepository(TCardTable);
   
    // Извлекаем параметры userId и companyId из строки запроса
        const { userId, companyId } = req.query;
    
    switch (req.method) {
      case 'GET':    
        // Строим фильтр для поиска
        const filter: any = {};       
        if (companyId) {
          filter.company_id = companyId;  // Фильтрация по company_id
        }

        // Выполняем запрос с фильтрацией
        const tCards = await tCardRepository.find({
          where: filter,  // Применяем фильтр к запросу
          select: ['id', 'date', 'number', 'coment', 'status'],  // Указываем, какие поля нужно вернуть
        });

        
        // Возвращаем результат
        res.status(200).json({ success: true,tCards:tCards});
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса:', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
  
}



