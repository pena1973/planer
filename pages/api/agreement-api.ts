import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../db/database';  // Импортируем функцию подключения

import { UserAgreeTable } from './../../db/models/catalogs/user_agree';
import { AgreementTable } from './../../db/models/catalogs/agreements';
import { signAgreement } from './../../handlers/handlers-auth';  // расчеты

interface RequestBody {
  userId: number,
  signedAgreement: boolean,
  agreementId: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable    
    const userAgreeRepository = dbConnection.getRepository(UserAgreeTable);
    const agreementRepository = dbConnection.getRepository(AgreementTable);

    switch (req.method) {
      // регистер
      case 'POST':
        // Извлекаем данные из тела запроса
        const { userId, signedAgreement, agreementId } = req.body as RequestBody;
        if (!agreementId) {
          res.status(200).json({
            success: false,
            signed: false,
            message: "нет соглашения нечего подписывать",
          });
          return;
        }

        // проверяем  есть ли такой логин  если есть - отказ
        const resUserAgree = await signAgreement(userId, signedAgreement, agreementId, userAgreeRepository)
        if (!resUserAgree.success) {
          res.status(200).json({
            success: false,
            signed: resUserAgree.signed,
            message: resUserAgree.message,
          });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
          signed: resUserAgree.signed,
        });
        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (agreement-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

