import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/database';  // Импортируем функцию подключения
import { UserTable } from '@/db/models/catalogs/users';

import { UserItem } from '@/types/types';

import { updateUser  } from '@/handlers/handlers-auth';  // расчеты

interface RequestBody {
  userId: number,
  teamId: number,
  oldpass: string,
  newpass: string,
  name: string
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const usersRepository = dbConnection.getRepository(UserTable);
  
    switch (req.method) {
      // регистер
      case 'POST':
        // Извлекаем данные из тела запроса
        const { userId, oldpass, newpass, name } = req.body as RequestBody;

        const resUpdUser = await updateUser(
          userId,
          oldpass,
          newpass,
          name,
          usersRepository);

        if (!resUpdUser.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUpdUser.message });
          return;
        }

        const user = resUpdUser.savedUser as UserItem;
        // отправляем ответ
        res.status(200).json({
          success: true,
          user: user,

        });
        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (profile-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}
export default withAuth(handler)

