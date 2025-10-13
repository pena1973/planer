//pages/api/tcard-oper-status-api
// API для изменения статуса карты
// Корректировка текущего статуса карты по ее состоянию в БД 

import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';


import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'

import { TCardTable } from './../../db/models/data/t_cards'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'

import { TCardOperationItem, StatusEnum } from './../../types/types';
import { updateStatusTCard } from './../../handlers/handlers-update';
import { getTCard, getTCardOperationsByCardId } from './../../handlers/handlers-get';
import { calculateTCardStatusByOperations } from './../../handlers/handlers-erase';

import { getStatusPriority } from "./../../lib/common/utils"

interface RequestBody {
  tCardId: number,
  teamId: number,
  userId: number
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
    const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'POST':

        // Извлекаем данные из тела запроса
        const { tCardId, teamId, userId } = req.body as RequestBody;

        // проверяем все операции карты и если  статусы не ниже текущего  меняем статус самой карты
        const tCardOperations = await getTCardOperationsByCardId(Number(userId), locale, tCardId, tCardOperationsRepository)

        const tCard = await getTCard(Number(userId), locale, tCardId, tCardRepository)
        if (!tCard) {
          res.status(200).json({
            success: false,
            message: t('mes.tCardNotFound'),
          });
          break;
        }

        const statusRes = await calculateTCardStatusByOperations(userId, locale, tCard.status, tCardOperations,);
        if (!statusRes.success) {
          res.status(200).json({
            success: false,
            message: t('mes.tCardStatusNotCalculated'),
          });
          break;
        }

        const finalCardStatus = statusRes.status;

        // / Обновим статус карты если он изменился
        if (tCard.status !== finalCardStatus) {
          const resCard = await updateStatusTCard(Number(userId), locale, tCardRepository, tCardId, finalCardStatus);
          if (!resCard.success) {
            res.status(200).json({
              success: false,
              message: resCard.message,
            });
            break;
          }
        }

        res.status(200).json({
          success: true,
          tCardStatus: finalCardStatus,
          // message: 'Карта успешно обновлена',
          message: t('mes.tCardUpdated'),
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
      location: "pages/api/tcard-oper-status-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}
export default withAuth(handler)