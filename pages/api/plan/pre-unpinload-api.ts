//pages/api/pre-unpinload-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
// Обработка перемещения операции лоада
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getTCardFull, getUnits, getTeamShedule, getUnitLoads, getUnitExceptions, getUnitActions } from './../../../handlers/handlers-get';  // 
import { planTCardFromOperINC, getDependentOperations } from './../../../handlers/handlers-plan';  // 

import { UnitLoadTable } from './../../../db/models/plan/unit_loads';
import { UnitExceptionTable } from './../../../db/models/plan/unit_exceptions';
import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { TCardTable } from './../../../db/models/data/t_cards'
import { UnitTable } from './../../../db/models/catalogs/units'

import { UnitActionTable } from './../../../db/models/catalogs/unit_actions'
import { TCardOperationTable } from './../../../db/models/data/t_card_operations'
import { ProductTable } from './../../../db/models/data/products'
import { TCardProductTable } from './../../../db/models/data/t_card_products'
import { TCardStageTable } from './../../../db/models/data/t_card_stages'
import { ActionTable } from './../../../db/models/catalogs/actions'
import { UnitLoadItem, StatusEnum } from "./../../../types/types";

interface RequestBody {
  userId: number,
  teamId: number,
  tCardId: number,
  operId: number, //  операция которую нужно открепить и перепланировать
  tCardLoads: UnitLoadItem[], // лоады по карте  
  today: string // дата раздела 
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();
    const unitRepository = getTypedRepository(db, 'UnitTable', UnitTable);
    const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
    const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
    const tCardProductRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
    const productRepository = getTypedRepository(db, 'ProductTable', ProductTable);
    const tCardOperationRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
    const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
    const unitExceptionsRepository = getTypedRepository(db, 'UnitExceptionTable', UnitExceptionTable);
    const tCardStageRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
    const actionRepository = getTypedRepository(db, 'ActionTable', ActionTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {

      // ПЕРЕПЛАНИРОВАНИЕ карты при откреплении Лоада
      //  нужно перепланировать все операции начиная с этой
      case 'POST':

        const { tCardId, operId, tCardLoads, today, userId, teamId } = req.body as RequestBody;

        // loads-Это все загрузки по карте которую перепланируем
        if (tCardLoads.length === 0) {
          // должно быть хотябы один лоад при перемешении
          // Если нет загрузок, можно вернуть пустой результат или обработать ошибку
          res.status(200).json({
            success: false,          
            // message: "Ошибка, не передано загрузок по карте",
            message: t('mes.noCardLoads'),
          });
          return;
        }

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(
          Number(userId),
          locale,
          Number(teamId),
          Number(tCardId),
          tCardRepository,
          tCardOperationRepository,
          tCardProductRepository,
          tCardStageRepository,
          productRepository,
          actionRepository
        )
        if (!tCard) {
          res.status(200).json({
            success: false,
            message: t('mes.tCardNotFound')
          });
          break
        }

        // находим нашу операцию в карте 
        const oper = tCard.tCardOperations?.find(op => op.id === operId)
        if (!oper) {
          //  logger
          void ulogger.error({
            userId: userId,
            location: "pages/api/plan/pre-moveload-api",
            event: "error",
            message: `Операция не найдена operId: ${operId}, tCardId: ${tCard.id}`,
            context: " const oper = tCard.tCardOperations?.find(op => op.id === operId)",
          }).catch(() => { console.error("logger error") });

          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: `${t('mes.tCardOperNotFound')}:  ${operId}`,
          });
          return
        }

        //  получаем список операций которые зависимы от нашей  -  их будем перепланировать
        const dependentOperations = getDependentOperations(tCard, oper);

        // добавлю и нашу операцию тоже
        dependentOperations.push(oper);

        // все зависимые операции
        const allDependentOperationsIds = dependentOperations
          .map(oper => oper.id as number)


        // Формируем массив лоадов по карте без лоадов этой операции и зависимых от нее (историю тоже не берем)
        const cardLoadsWithoutOperEndDep = tCardLoads.filter(load =>
          !(allDependentOperationsIds.includes(load.id_oper as number)
            // && load.date >= today
          )
        );

        // также для сохранения истории мы по этой операции и зависимым операциям должны оставить все отмененные бракованные и готовые и отмененные
        const cardLoadsOperEndDepHistory = tCardLoads.filter(load =>
          // load.date < today
          !(load.status === StatusEnum.prepared || load.status === StatusEnum.planed)
          && (allDependentOperationsIds.includes(load.id_oper as number))
        );

        let planedCardLoads = [...cardLoadsWithoutOperEndDep, ...cardLoadsOperEndDepHistory];

        // сортируем по возрастанию
        planedCardLoads.sort((a, b) =>
          a.date.localeCompare(b.date) || a.timeStart - b.timeStart
        );

        // запросим юниты
        const units_ = await getUnits(Number(userId), locale, Number(teamId), unitRepository)

        // запросим действия юнитов
        const unitActions_ = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository)

        // запросим расписание компании
        const shedule = await getTeamShedule(Number(userId), locale, Number(teamId), teamScheduleRepository)

        if (!shedule) {
          res.status(200).json({
            success: false,
            // message: "Ошибка, не найдено расписание команды",
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
          units_,
          unitLoadRepository,
          unitActionsRepository)
        //  уберем из нее лоады нашей карты
        let unitLoadItemsFull = unitLoadItemsBD.filter(lo => tCardId !== lo.id)
        //  и добавим  лоады без операций которые надо перепланировать
        unitLoadItemsFull = [...unitLoadItemsFull, ...cardLoadsWithoutOperEndDep];

        // планируем все операции  начиная (включая) с нашей  (исключая пришпиленные)
        const operationsToPlanIds = [...allDependentOperationsIds, Number(oper.id)]

        // Планируем карту начиная с нашей операции (есключая ее саму)
        const resultPlaningNextOper = planTCardFromOperINC(Number(userId), locale, operationsToPlanIds, tCard, units_, unitActions_, shedule, unitLoadItemsFull, exceptionItems, today)
        //  Если не удалось запланировать
        if (!resultPlaningNextOper.success) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: resultPlaningNextOper.message,
          });
          break;
        }
        planedCardLoads = [...planedCardLoads, ...resultPlaningNextOper.planedCardLoads]

        // отправляем ответ
        res.status(200).json({
          success: true,
          tCardLoads: planedCardLoads,
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
      location: "pages/api/plan/pre-unpinload-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)