//pages/api/plan/eraze-card-plan-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { getEarliestStart } from './../../../handlers/handlers-plan';  // планирование карты

import { UnitLoadTable } from './../../../db/models/plan/unit_loads';
import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
import { TCardTable } from './../../../db/models/data/t_cards'
import { TeamTable } from './../../../db/models/catalogs/teams'
import { TCardOperationTable } from './../../../db/models/data/t_card_operations'
import { TCardProductTable } from './../../../db/models/data/t_card_products'
import { ProductTable } from './../../../db/models/data/products'
import { getTCardFull, getTeamShedule } from './../../../handlers/handlers-get';  // 
import { updateStatusTCard, updateStatusOperationsByOperIds } from './../../../handlers/handlers-update';  // 
import { cancelHistoryLoadsByOperIds, deleteFutureLoadsByOperIds } from './../../../handlers/handlers-erase';  // 
import { ActionTable } from './../../../db/models/catalogs/actions'
import { TCardStageTable } from './../../../db/models/data/t_card_stages'

import { TCardOperationItem, UnitLoadItem, StatusEnum } from "./../../../types/types";
import { getCurrentDateInString } from "@/lib/common/timezone";


interface RequestBody {
  tCardLoads: UnitLoadItem[],
  tCardId: number,
  teamId: number,
  userId: number
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  try {
    const db = await connectDb();
    const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
    const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
    const tCardProductRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
    const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
    const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
    const tCardStagesRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
    const productRepository = getTypedRepository(db, 'ProductTable', ProductTable);
    const actionRepository = getTypedRepository(db, 'ActionTable', ActionTable);
    
    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); 

    switch (req.method) {
      // Стираем планирование всех плановых и отменяем все что в истории кроме выполненных
      case 'POST':
        //  загрузки по карте и только draft -  массив интервалов
        const { tCardLoads, tCardId, teamId, userId } = req.body as RequestBody;
        //tCardLoads //Это все лоады покарте

        // запросим расписание компании чтобы взять timezone
        const shedule = await getTeamShedule(userId, locale, teamId, teamScheduleRepository)

        if (!shedule) {
          res.status(200).json({
            success: false,
            // message: "Ошибка, не найдено расписание команды",
            message: t('mes.sheduleNotFound'),
          });
          break;
        }

        // на всякий случай синхронизируем дату с серверной
        const today = getCurrentDateInString(shedule.timeZone)

        // Убираем prepared
        let tCardLoadsUpdated = tCardLoads.filter(lo => {
          return lo.status !== StatusEnum.prepared
        });

        // выделяем лоады planed отдельно
        const tCardLoadsPlaned = tCardLoadsUpdated.filter(lo => lo.status === StatusEnum.planed);
        tCardLoadsUpdated = tCardLoadsUpdated.filter(lo => lo.status !== StatusEnum.planed);


        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(
          Number(userId),
          locale,
          Number(teamId),
          Number(tCardId),
          tCardRepository,
          tCardOperationsRepository,
          tCardProductRepository,
          tCardStagesRepository,
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
        let tCardStatus = tCard.status;

        // получаем операции planed с актуальными датами планирования, 
        // операции planed еше не выполнены и их можно отменить если история 
        // или вообще удалить если будущее
        const oper_dateStart = tCard.tCardOperations?.map(op => {
          const opLoads = tCardLoadsPlaned.filter(lo => lo.id_oper === op.id)
          const earliestStart = getEarliestStart(opLoads);
          if (!earliestStart) return undefined //  просто уберем операцию из обработки  ее итак нет 
          return { oper: op, dateStart: earliestStart.date }
        }).filter(op => (op)) as { oper: TCardOperationItem, dateStart: string }[];

        const operToCancellIds = oper_dateStart.filter(elem => elem.dateStart < today).map(elem => elem.oper.id) as number[] //  в истории канцелим
        const operToDeleteIds = oper_dateStart.filter(elem => elem.dateStart >= today).map(elem => elem.oper.id) as number[] // в планировании удаляем

        // обрабатываем  лоады  в базе      
        if (operToCancellIds.length > 0) {
          const resCancel = await cancelHistoryLoadsByOperIds(userId, locale, operToCancellIds, today, unitLoadRepository);
          if (!resCancel.success) {
            res.status(200).json({
              success: false,
              // message: "Не удалось отменить историческое планирование операции и зависимых от нее" 
              message: resCancel.message
            });
            break
          }
        }

        if (operToDeleteIds.length > 0) {
          const resDelete = await deleteFutureLoadsByOperIds(userId, locale, operToDeleteIds, today, unitLoadRepository);
          if (!resDelete.success) {
            res.status(200).json({
              success: false,
              // message: "Не удалось уалить запланированные лоады" 
              message: resDelete.message
            });
            break
          }
        }

        const operToMakePreparedIds = [...operToDeleteIds, ...operToCancellIds];

        // обрабатываем  в базе операции при отмене лоадов операция уходит в prepared если они есть
        if (operToMakePreparedIds.length > 0) {
          const resOpers = await updateStatusOperationsByOperIds(userId, locale, tCardOperationsRepository, operToMakePreparedIds, StatusEnum.prepared)

          if (!resOpers.success) {
            res.status(200).json({
              success: false,
              // error: 'Не удалось обработать запрос. ' + resOpers.message 
              message: `${t('mes.operStatusesNotSaved')}  ${resOpers.message}`
            });
            break;
          }
        }

        // КАРТА
        // меняем в базе статус карты на Prepared  если действительно есть что отменять
        if (operToMakePreparedIds.length > 0) {
          const resSetTCardStatus = await updateStatusTCard(userId, locale, tCardRepository, tCardId, StatusEnum.prepared);

          if (!resSetTCardStatus.success) {
            res.status(200).json({
              success: false,
              message: resSetTCardStatus.message,
            });
            break;
          }
          tCardStatus = StatusEnum.prepared; // обновляем статус карты в ответе
        }

        // собираем все отработанные лоады с измененными статусами
        const tCardLoadsPlaned_ = tCardLoadsPlaned.filter(lo => operToCancellIds.includes(lo.id_oper)).map(lo => { return { ...lo, status: StatusEnum.cancelled } })
        tCardLoadsUpdated = [...tCardLoadsUpdated, ...tCardLoadsPlaned_]
        // отправляем ответ
        res.status(200).json({
          success: true,
          tCardLoads: tCardLoadsUpdated,
          tCardStatus: tCardStatus,
          canceledOperIds: operToCancellIds, // лоады отменены, операция переведена в отменен
          preparedOperIds: operToDeleteIds,  // лоады удалены, операция переведена в подготовлен
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
      location: "pages/api/plan/eraze-card-plan-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)