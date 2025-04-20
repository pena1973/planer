// Обработка перемещения операции лоада
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getTCardFull, getUnits, getTeamShedule, getUnitLoads, getExceptions, getTCardOperation } from './handlers-get';  // 
import {
  getPreviousOpers, getFinishOperations, getLaterDateTime, 
  planTCardFromOperINC, planOperOnUnit, getDependentOperationsIds
} from './handlers-plan';  // 


import { Repository, In } from 'typeorm';

import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions';
import { TeamScheduleTable } from '@/pages/db/models/plan/team_schedule';
import { TCardTable } from '@/pages/db/models/data/t_cards'

import { UnitTable } from '@/pages/db/models/catalogs/units'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'


import {UnitLoadItem,} from "@/types";

interface RequestBody {
  tCardId: number,
  operId: number, //  операция которую нужно открепить и перепланировать
  tCardLoads: UnitLoadItem[], // лоады по карте  
  today: string // дата раздела 
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const teamScheduleRepository = dbConnection.getRepository(TeamScheduleTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);
    // userId, teamId в любом случае

    const { userId, teamId } = req.query;

    switch (req.method) {

      // ПЕРЕПЛАНИРОВАНИЕ карты при откреплении Лоада
      //  нужно перепланировать все операции начиная с этой
      case 'POST':

        const { tCardId, operId, tCardLoads, today } = req.body as RequestBody;

        // loads-Это все загрузки по карте которую перепланируем
        if (tCardLoads.length === 0) {
          // должно быть хотябы один лоад при перемешении
          // Если нет загрузок, можно вернуть пустой результат или обработать ошибку
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: "Ошибка, не передано загрузок по карте",
          });
          return;
        }

        // получаем полную карту со всеми входящими и исходящими
        const tCard = await getTCardFull(tCardId, tCardRepository, tCardOperationsRepository, tCardProductRepository)
        if (!tCard) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: "Карта не найдена",
          });
          return
        }

        // находим нашу операцию в карте 
        const oper = tCard.tCardOperations?.find(op => op.id === operId)
        if (!oper) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: `Операция ${operId} по карте С-${tCard.number} не найдена `,
          });
          return
        }
        //  получаем список операций которые зависимы от нашей  -  их будем перепланировать
        let dependentOperationsIds = getDependentOperationsIds(tCard, oper);

        // Формируем массив по карте без лоадов этой операции и зависимых от нее
        let cardLoadsWithoutOperEndDep = tCardLoads.filter(load =>
          !(load.id_oper === operId || dependentOperationsIds.includes(load.id_oper as number))
        );
        
        // сортируем по возрастанию
        cardLoadsWithoutOperEndDep.sort((a, b) =>
          a.date.localeCompare(b.date) || a.timeStart - b.timeStart
        );
        
        let planedCardLoads = [...cardLoadsWithoutOperEndDep];

        // запросим юниты
        const units_ = await getUnits(Number(teamId), unitRepository, unitActionsRepository)

        // запросим расписание компании
        const shedule_ = await getTeamShedule(Number(teamId), teamScheduleRepository)

        //  получим исключения рабочего времени юнитов         
        const exceptionItems = await getExceptions(Number(teamId), unitExceptionsRepository)
        //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
        const unitLoadItemsBD = await getUnitLoads(units_, unitLoadRepository)
        //  уберем из нее лоады нашей карты
        let unitLoadItemsFull = unitLoadItemsBD.filter(lo => tCardId !== lo.id)
        //  и добавим  лоады без операций которые надо перепланировать
        unitLoadItemsFull = [...unitLoadItemsFull, ...cardLoadsWithoutOperEndDep];

        // планируем все операции  начиная (включая) с нашей  (исключая пришпиленные)

        let operationsToPlanIds= [...dependentOperationsIds,Number(oper.id)]
        
        // Планируем карту начиная с нашей операции (есключая ее саму)
        let resultPlaningNextOper = planTCardFromOperINC(operationsToPlanIds, tCard, units_, shedule_, unitLoadItemsFull, exceptionItems, today)
        //  Если не удалось запланировать
        if (!resultPlaningNextOper.success) {
          res.status(200).json({
            success: false,
            tCardLoads: tCardLoads,
            message: resultPlaningNextOper.message,
          });
          break;
        }
        planedCardLoads = [...planedCardLoads,...resultPlaningNextOper.planedCardLoads]

        // отправляем ответ
        res.status(200).json({
          success: true,
          tCardLoads: planedCardLoads,
          message: ""
        });
        break;


      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (erazeplan-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}



// function getLastLoadFinish(operloads: UnitLoadItem[]): { date: string; time: number } | undefined {
//   if (operloads.length === 0) return undefined;
//   // Инициализируем первый элемент как "наиболее поздний"
//   let lastLoad = operloads[0];
//   for (const load of operloads) {
//     // Сравниваем даты, так как формат "YYYY-MM-DD" корректно сравнивается лексикографически
//     if (load.date > lastLoad.date) {
//       lastLoad = load;
//     } else if (load.date === lastLoad.date && load.timeFinish > lastLoad.timeFinish) {
//       lastLoad = load;
//     }
//   }
//   return { date: lastLoad.date, time: lastLoad.timeFinish };
// }
