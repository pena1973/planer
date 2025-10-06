// pages/api/agreement-api.ts
// API для подписания соглашения (agreement)
// Используется при согласии пользователя с условиями соглашения
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../db/database';  // Импортируем функцию подключения
import { getLocaleFromHeader } from './../../lib/server/locale';

import { getTypedRepository } from './../../db/utilites'
import { UserAgreeTable } from './../../db/models/catalogs/user_agree';
import { signAgreement } from './../../handlers/handlers-auth';

interface RequestBody {
  userId: number,
  signedAgreement: boolean,
  agreementId: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await connectDb();

    const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);


    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    const t = getServerT(locale, 'translation');

    switch (req.method) {
      case 'POST':

        const { userId, signedAgreement, agreementId } = req.body as RequestBody;

        if (!agreementId) {
          res.status(200).json({
            success: true,
            signed: false,
            // message: "нет соглашения нечего подписывать",
            message: t("mes.noAgreementToSign"),
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
      location: "pages/api/agreement-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

