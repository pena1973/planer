
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../db/database';  // Импортируем функцию подключения
import { getLocaleFromHeader } from './../../lib/server/translate/locale';

import { getTypedRepository } from './../../db/utilites'
import { UserAgreeTable } from './../../db/models/catalogs/user_agree';
import { signAgreement } from './../../handlers/handlers-auth';  // расчеты

interface RequestBody {
  userId: number,
  signedAgreement: boolean,
  agreementId: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const db = await connectDb();

  const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);

  try {
   const locale = getLocaleFromHeader(req.headers["x-lang"]);
    switch (req.method) {
      case 'POST':
        // Извлекаем данные из тела запроса
        const { userId, signedAgreement, agreementId } = req.body as RequestBody;
        if (!agreementId) {
          res.status(200).json({
            success: true,
            signed: false,
            message: "нет соглашения нечего подписывать",
          });
          return;
        }

        // проверяем  есть ли такой логин  если есть - отказ
        const resUserAgree = await signAgreement(userId, locale, signedAgreement, agreementId, userAgreeRepository)
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

