//pages/api/plan/pre-fullcardplan-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getUnits, getUnitLoads } from './../../../handlers/handlers-get';  // расчеты
import { getAllPreparedOperationsIds, planTCardFromOperINC } from './../../../handlers/handlers-plan';  // планирование карты
import { getTeamShedule, getUnitExceptions, getTCardFull, getUnitActions } from './../../../handlers/handlers-get';  // 

import { TeamTable } from './../../../db/models/catalogs/teams'
import { UnitLoadTable } from './../../../db/models/plan/unit_loads';
import { UnitExceptionTable } from './../../../db/models/plan/unit_exceptions';
import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { TCardTable } from './../../../db/models/data/t_cards'

import { UnitTable } from './../../../db/models/catalogs/units'

import { UnitActionTable } from './../../../db/models/catalogs/unit_actions'
import { TCardOperationTable } from './../../../db/models/data/t_card_operations'
import { TCardProductTable } from './../../../db/models/data/t_card_products'
import { TCardStageTable } from './../../../db/models/data/t_card_stages'
import { ProductTable } from './../../../db/models/data/products'
import { ActionTable } from './../../../db/models/catalogs/actions'
import { UnitLoadItem } from "./../../../types/types";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  try {
    const db = await connectDb();
    const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
    const unitRepository = getTypedRepository(db, 'UnitTable', UnitTable);
    const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
    const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
    const tCardProductRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
    const productRepository = getTypedRepository(db, 'ProductTable', ProductTable);
    const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
    const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
    const unitExceptionsRepository = getTypedRepository(db, 'UnitExceptionTable', UnitExceptionTable);
    const tCardStageRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
    const actionRepository = getTypedRepository(db, 'ActionTable', ActionTable);


    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

    switch (req.method) {

      // ПРЕДВАРИТЕЛЬНОЕ ПЛАНИРОВАНИЕ/допланирование недостающих операций карты
      case 'GET':
        const { userId, teamId, tCardId, today } = req.query;
        const tCardLoads = [] as UnitLoadItem[];

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(
          Number(userId),
          locale,
          Number(teamId),
          Number(tCardId),
          tCardRepository,
          tCardOperationsRepository,
          tCardProductRepository,
          tCardStageRepository,
          productRepository,
          actionRepository)


        if (!tCard) {
          res.status(200).json({
            success: false,
            message: t('mes.tCardNotFound')
          });
          break
        }

        const allPreparedOperationsIds = getAllPreparedOperationsIds(tCard);

        // запросим юниты
        const units = await getUnits(Number(userId), locale, Number(teamId), unitRepository)

        // запросим действия юнитов
        const unitActions = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository)

        // запросим расписание компании
        const shedule = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)

        if (!shedule) {
          res.status(200).json({
            success: false,
            message: t('mes.sheduleNotFound'),
          });
          break;
        }

        //  получим исключения рабочего времени юнитов         
        const exceptionItems = await getUnitExceptions(Number(userId), locale, Number(teamId), unitExceptionsRepository)

        //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
        const unitLoadItemsBD = await getUnitLoads(
          Number(userId),
          locale,
          Number(teamId),
          units,
          unitLoadRepository,
          unitActionsRepository
        )

        // Планируем карту все операции статуса prepared        
        const resultPlaningNextOper = planTCardFromOperINC(Number(userId), locale, allPreparedOperationsIds, tCard, units, unitActions, shedule, unitLoadItemsBD, exceptionItems, String(today))

        //  Если не удалось запланировать
        if (!resultPlaningNextOper.success) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: resultPlaningNextOper.message,
          });
          break;
        }

        // Отправляем ответ с данными  в базе их нет это только драфт
        res.status(200).json({
          success: true,
          tCardLoads: resultPlaningNextOper.planedCardLoads,
          messsage: resultPlaningNextOper.message,
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
      location: "pages/api/plan/pre-fullcardplan-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)