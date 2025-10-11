//pages/api/support-api.ts
// API для получения и обновления сообщений поддержки (support messages)
// Используется для отправки сообщений в поддержку и просмотра ответов 
import { ulogger } from "./../../../lib/common/universal-logger";

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { BanerTable } from './../../../db/models/support/baners';
import { getBaner } from './../../../handlers/handlers-get';  // расчеты
import { setBaner } from './../../../handlers/handlers-update';  // расчеты
import { BanerItem } from '@/types/service-types'

interface RequestBody {
  baner: BanerItem,
  userId: number
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const banerRepository = getTypedRepository(db, 'BanerTable', BanerTable);


    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    

    switch (req.method) {
      case 'GET':

        const { teamId, userId: userIdget } = req.query;

        const banerGet = await getBaner(
          Number(userIdget),
          locale,
          (teamId) ? Number(teamId) : undefined, // банер может быть безадресный
          banerRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          baner: banerGet,
          message: ""
        });

        break;
      case 'POST':
        const { baner, userId } = req.body as RequestBody;
        const banerPost = await setBaner(Number(userId), locale, baner, banerRepository)

        // отправляем ответ
        res.status(200).json({
          success: true,
          baner: banerPost,
          message: ""
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
      location: "pages/api/admin/baner-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)