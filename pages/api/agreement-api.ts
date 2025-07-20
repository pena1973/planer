import { Repository } from 'typeorm';
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../db/database';  // Импортируем функцию подключения
import { getRepositoryByName } from '@/lib/db/utilites';
import { getTypedRepository } from './../../lib/db/utilites'
import { UserAgreeTable } from './../../db/models/catalogs/user_agree';
import { AgreementTable } from './../../db/models/catalogs/agreements';
import { signAgreement } from './../../handlers/handlers-auth';  // расчеты
import { entities } from '@/lib/db/entities';


interface RequestBody {
  userId: number,
  signedAgreement: boolean,
  agreementId: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const db = await connectDb();
  // const meta = db.entityMetadatas.find(m => m.name === 'UserAgreeTable');
  // if (!meta) {
  //   throw new Error('UserAgreeTable не зарегистрирован в метаданных');
  // }
  // // 👇 здесь указываем явно тип
  // const userAgreeRepository: Repository<UserAgreeTable> = db.getRepository(meta.target as typeof UserAgreeTable);

  const agreementRepository = getTypedRepository(db, 'AgreementTable', AgreementTable);
  const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);

  try {
 
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

