//pages/api/tcards-api.ts
// API для получения, создания, обновления и удаления карт (TCard)
// Используется 
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'

import { TCardTable } from './../../db/models/data/t_cards';
import { getTCards } from './../../handlers/handlers-get';   
import { StatusEnum } from './../../types/types';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'GET':

        const { userId, teamId: teamIdget } = req.query;

        const statuses = [
          StatusEnum.defective,
          StatusEnum.draft,
          StatusEnum.performed,
          StatusEnum.planed,
          StatusEnum.prepared,
          StatusEnum.ready]; // статусы для фильтрации

        const tCards = await getTCards(Number(userId), locale, Number(teamIdget), statuses, tCardRepository)

        // Возвращаем результат
        res.status(200).json({ success: true, tCards: tCards });
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
      location: "pages/api/tcards-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}
export default withAuth(handler)


