import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../../db/database';  // Импортируем функцию подключения
import { getLocaleFromHeader } from './../../../lib/server/translate/locale';
import { UserTable } from './../../../db/models/catalogs/users';

import { getTypedRepository } from './../../../db/utilites'
import {  confirmUserEmail } from './../../../handlers/handlers-auth';  // расчеты

interface RequestBody {
  email: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 const db = await connectDb();
 const usersRepository = getTypedRepository(db, 'UserTable', UserTable);  
 console.log('🧠 DataSource from login:', db.options.database, '| hash:', db.entityMetadatas.map(m => m.name).join(','));

  try {

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'POST':
        // Извлекаем данные из тела запроса
        const { email } = req.body as RequestBody;

        const resUser = await confirmUserEmail(locale,email, usersRepository)
        if (!resUser.success) {
          res.status(200).json({
            success: false,
            message: resUser.message,
          });
          return;
        }

        if (!resUser.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUser.message });
          return;
        }
      
        // отправляем ответ
        res.status(200).json({
          success: true,      
        });
        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (login-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

