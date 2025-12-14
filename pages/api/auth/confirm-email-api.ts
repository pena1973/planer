
//pages/api/catalogs/template-api.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../../db/database';  // Импортируем функцию подключения
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { UserTable } from './../../../db/models/catalogs/users';

import { getTypedRepository } from './../../../db/utilites'
import { confirmUserEmail } from './../../../handlers/handlers-auth';  // расчеты

interface RequestBody {
  email: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await connectDb();
    const usersRepository = getTypedRepository(db, 'UserTable', UserTable);
    
    // console.log('🧠 DataSource from login:', db.options.database, '| hash:', db.entityMetadatas.map(m => m.name).join(','));

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'POST':
        // Извлекаем данные из тела запроса
        const { email } = req.body as RequestBody;

        const resUser = await confirmUserEmail(locale, email, usersRepository)
        if (!resUser.success) {
          res.status(200).json({
            success: false,
            message: resUser.message,
          });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
        });
        break;
      default:
        res.status(405).json({ error: 'Method not supported.' });
    }
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/auth/confirm-email-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

