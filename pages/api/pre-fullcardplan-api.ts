
import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../lib/db/utilites'

import { getUnits, getUnitLoads } from './../../handlers/handlers-get';  // расчеты
import { getAllPreparedOperationsIds, planTCardFromOperINC } from './../../handlers/handlers-plan';  // планирование карты
import { getTeamShedule, getExceptions, getTCardFull, getUnitActions } from './../../handlers/handlers-get';  // 

import { TeamTable } from './../../db/models/catalogs/teams'
import { UnitLoadTable } from './../../db/models/plan/unit_loads';
import { UnitExceptionTable } from './../../db/models/plan/unit_exceptions';
import { TeamScheduleTable } from './../../db/models/plan/team_schedule';
import { TCardTable } from './../../db/models/data/t_cards'

import { UnitTable } from './../../db/models/catalogs/units'

import { UnitActionTable } from './../../db/models/catalogs/unit_actions'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'
import { TCardProductTable } from './../../db/models/data/t_card_products'
import { TCardStageTable } from './../../db/models/data/t_card_stages'
import { ProductTable } from './../../db/models/data/products'
import { ActionTable } from './../../db/models/catalogs/actions'
import { UnitLoadItem } from "./../../types/types";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

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
  try {

    const { userId, teamId, tCardId, today } = req.query;

    switch (req.method) {
      // ПРЕДВАРИТЕЛЬНОЕ ПЛАНИРОВАНИЕ/допланирование недостающих операций карты
      case 'GET':

        const tCardLoads = [] as UnitLoadItem[];

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(
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
            tCardLoads: [] as UnitLoadItem[],
            message: "Карта не найдена",
          });
          return
        }

        const allPreparedOperationsIds = getAllPreparedOperationsIds(tCard);

        // запросим юниты
        const units_ = await getUnits(Number(teamId), unitRepository)

        // запросим действия юнитов
        const unitActions_ = await getUnitActions(Number(teamId), unitActionsRepository)

        // запросим расписание компании
        const shedule_ = await getTeamShedule(Number(teamId), teamScheduleRepository, teamsRepository)

        //  получим исключения рабочего времени юнитов         
        const exceptionItems = await getExceptions(Number(teamId), unitExceptionsRepository)
        //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
        const unitLoadItemsBD = await getUnitLoads(
          Number(teamId),
          units_,
          unitLoadRepository,
          unitActionsRepository
        )


        //  уберем из нее лоады нашей карты 
        //  const unitLoadItemsFull = unitLoadItemsBD.filter(lo => Number(tCardId) !== lo.id_tCard)
        // в этих лоадах нет операций в статусе prepared


        // Планируем карту все операции статуса prepared
        // const resultPlaningNextOper = planTCardFromOperINC(allPreparedOperationsIds, tCard, units_, unitActions_, shedule_, unitLoadItemsFull, exceptionItems, String(today))
        const resultPlaningNextOper = planTCardFromOperINC(allPreparedOperationsIds, tCard, units_, unitActions_, shedule_, unitLoadItemsBD, exceptionItems, String(today))

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
        res.status(405).end(); // Метод не поддерживается
    }

  } catch (error: unknown) {
    let errorMessage = "Не удалось обработать запрос.";

    if (error instanceof Error) {
      errorMessage += " " + error.message;
      console.error("Ошибка подключения или выполнения запроса ((pre-fullcardplan-api)):", error);
    } else {
      console.error("Неизвестная ошибка ((pre-fullcardplan-api)):", error);
    }

    res.status(500).json({ error: errorMessage });
  }

}

export default withAuth(handler)