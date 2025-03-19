
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getTCardFull, getUnits, getCompanyShedule, getUnitLoads, getExceptions } from './handlers-get';  // 
import { getPreviousOpers, getFinishOperations, getLaterDateTime, planTCardFromOper } from './handlers-plan';  // 


import { Repository, In } from 'typeorm';

import { UnitLoadTable } from '@/pages/db/models/plan/unit-loads';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit-exceptions';
import { CompanyScheduleTable } from '@/pages/db/models/plan/company-schedule';
import { TCardTable } from '@/pages/db/models/data/t_cards'

import { UnitTable } from '@/pages/db/models/catalogs/units'
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'


import {
  UnitItem,
  UnitActionItem, TCardProductItem, TCardOperationItem,
  TCardItem, UnitLoadItem,
  UnitBelongEnum, UnitTypeEnum,
  CalendarItem, TimeTypeEnum, StatusEnum
} from "@/types";

interface RequestBody {
  pinnedLoad: UnitLoadItem,
  loads: UnitLoadItem[], // лоады по карте
  unit: UnitItem,  // Юнит куда перемещаем
  date: string,    // Дата куда перемещаем
  timeStart: number //  время куда перемещаем  
  timeFinish: number //  время окончания в случае если это внешний юнит
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
    const companyScheduleRepository = dbConnection.getRepository(CompanyScheduleTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);
    // userId, companyId в любом случае

    const { userId, companyId } = req.query;

    switch (req.method) {

      // ЗАПИСЬ  запланированной КАРТЫ в которой стираем планирование
      case 'POST':
        const { pinnedLoad, loads, unit, date, timeStart, timeFinish } = req.body as RequestBody; //  загрузки по карте и только draft -  массив интервалов

        if (loads.length === 0) {
          // Если нет загрузок, можно вернуть пустой результат или обработать ошибку
          return [];
        }
        // Формируем массив без лоадов этой операции
        let updatedOperloads = loads.filter(load => load.id_oper !== pinnedLoad.id_oper);
        // выбираем все лоады по этой операции
        let operloads = loads.filter(load => load.id_oper === pinnedLoad.id_oper);
        // сортируем по возрастанию
        operloads.sort((a, b) =>
          a.date.localeCompare(b.date) || a.timeStart - b.timeStart
        );

        let loadStart = operloads[0];
        let loadFinish = operloads[operloads.length - 1];

        // получаем полную карту
        const tCard = await getTCardFull(pinnedLoad.id_tCard, tCardRepository, tCardOperationsRepository, tCardProductRepository)
        if (!tCard) {
          res.status(200).json({
            success: false,
            unitsLoads: loads,
            message: "Карта не найдена",
          });
          return
        }

        // находим нашу операцию в карте
        const oper = tCard.tCardOperations?.find(op => op.id === pinnedLoad.id_oper)
        if (!oper) {
          res.status(200).json({
            success: false,
            unitsLoads: loads,
            message: `Операция ${pinnedLoad.idc_oper} по карте С-${tCard.number} не найдена `,
          });
          return

        }
        // если цель перетаскивания это внешний юнит смотрим начальный или конечный лоад операции
        if (unit.belong = UnitBelongEnum.outer) {
          // 1. перетаскиваем с внутреннего на внешний
          if (pinnedLoad.unit.belong === UnitBelongEnum.inner) {
            let previousOpersIdcs = getPreviousOpers(oper, tCard);
            if (!previousOpersIdcs) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Источник и результат карты не согласован С-" + tCard.number,
              });
              return
            }
            const timeRes = getFinishOperations(previousOpersIdcs, loads, date);
            if (!timeRes) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Источник и результат карты не согласован С-" + tCard.number,
              });
              return
            }
            //  момент возможного выполнения операции (закончены все предыдущие)         
            const correctRes = getLaterDateTime(timeRes, { date: date, time: timeStart });

            // Формируем стартовый лоад 
            updatedOperloads.push(
              {
                ...loadStart,
                unit: unit,
                isRetool: false,
                date: correctRes.date,
                timeStart: correctRes.time,
                timeFinish: correctRes.time + 5,
                isPinned: true,
                isOuterStart: true,
                loadInfo: (loadStart.loadInfo) ? { ...loadStart.loadInfo, koef: 1 } : undefined
              })

            // Формируем финишный лоад 
            updatedOperloads.push(
              {
                ...loadFinish,
                unit: unit,
                isRetool: false,
                timeStart: timeFinish - 5,
                timeFinish: timeFinish,
                isPinned: true,
                isOuterFinish: true,
                loadInfo: (loadFinish.loadInfo) ? { ...loadFinish.loadInfo, koef: 1 } : undefined
              })
          }

          // 2. перетаскиваем с внешнего на внешний и если корректируемый лоад уже стартовый 
          if ((pinnedLoad.isOuterStart && pinnedLoad.unit.belong === UnitBelongEnum.outer)) {
            // ищем дату время с которой операция может стартовать операция исходя из готовности запчастей  
            let previousOpersIdcs = getPreviousOpers(oper, tCard);
            if (!previousOpersIdcs) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Источник и результат карты не согласован С-" + tCard.number,
              });
              return
            }
            const timeRes = getFinishOperations(previousOpersIdcs, loads, date);
            if (!timeRes) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Источник и результат карты не согласован С-" + tCard.number,
              });
              return
            }
            //  момент возможного выполнения операции (закончены все предыдущие)         
            const correctRes = getLaterDateTime(timeRes, { date: date, time: timeStart });

            // Формируем стартовый лоад 
            updatedOperloads.push(
              {
                ...loadStart,
                unit: unit,
                isRetool: false,
                date: correctRes.date,
                timeStart: correctRes.time,
                timeFinish: correctRes.time + 5,
                isPinned: true,
                isOuterStart: true,
                loadInfo: (loadStart.loadInfo) ? { ...loadStart.loadInfo, koef: 1 } : undefined
              })
            //  финишный оставляю как есть            
            updatedOperloads.push(loadFinish);
          }

          // 3. перетаскиваем с внешнего на внешний и если корректируемый лоад уже финишный
          if ((pinnedLoad.isOuterFinish && pinnedLoad.unit.belong === UnitBelongEnum.outer)) {
           
            //  стартовый оставляю как есть            
            updatedOperloads.push(loadStart);
            //  финишный меняю дату время 
            updatedOperloads.push(
              {
                ...loadFinish,
                date:date,
                unit: unit,
                isRetool: false,
                timeStart: timeFinish - 5,
                timeFinish: timeFinish,
                isPinned: true,
                isOuterFinish: true,
                loadInfo: (loadFinish.loadInfo) ? { ...loadFinish.loadInfo, koef: 1 } : undefined
              })


            // проверяем / перепланируем начиная с этой операции

            // ДОПИСАТЬ
            // запросим юниты
            const units_ = await getUnits(Number(companyId), unitRepository, unitActionsRepository)

            // запросим расписание компании
            const shedule_ = await getCompanyShedule(Number(companyId), companyScheduleRepository)

            //  получим загрузку юнитов  до планирования новой карты         
            const unitLoadItems = await getUnitLoads(units_, unitLoadRepository)
            let unitLoadItems_ = unitLoadItems.filter(lo=>pinnedLoad.id_tCard!==lo.id)
            unitLoadItems_=[...unitLoadItems, ...loads];
            //  получим исключения рабочего времени юнитов         
            const exceptionItems = await getExceptions(Number(companyId), unitExceptionsRepository)


            // Планируем карту начиная с нашей операции 
            let resultPlaning = planTCardFromOper(oper, tCard, units_, shedule_, unitLoadItems_, exceptionItems, date as string)
            //  Если не удалось запланировать
            if (!resultPlaning.success) {
              res.status(200).json({
                success: false,
                unitsLoads: unitLoadItems,
                message: resultPlaning.message,
              });
              break;
            }
            updatedOperloads = resultPlaning.loads.filter(lo=>lo.id_tCard===tCard.id)
          }
        }
        // внутренний
        else {
          //  проверили чтоб она не начиналось раньше чем готовы входящие части, если не готовы  -  сдвигаем эту операцию (сохраняя юнита)
          //- пришпилили - нужно перепланировать с этой даты
          // ДОПИСАТЬ

        }


        // отправляем ответ
        res.status(200).json({
          success: true,
          unitsLoads: updatedOperloads,
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
// ЗАГРУЗКИ ЮНИТОВ ПО КАРТЕ
async function deleteLoads(
  unitLoadRepository: Repository<UnitLoadTable>,
  unitLoads: UnitLoadItem[],
): Promise<{ success: boolean, message?: string }> {

  const loadIds = unitLoads.map(load => load.id); // Получаем массив идентификаторов

  if (loadIds.length === 0) return { success: true, message: "" }

  const unitLoads_ = await unitLoadRepository.createQueryBuilder('unitLoad')
    .andWhere('unitLoad.id IN (:...loadIds)', { loadIds }) // Фильтруем по unitIds
    .getMany();

  if (unitLoads_.length > 0) {
    await unitLoadRepository.remove(unitLoads_);
    console.log(`Удалено ${unitLoads_.length} операций`);
  }

  return { success: true, message: "" }
}
// ТКАРТА ОБНОВЛЯЮ СТАТУС
// 
async function updateStatusCard(
  tCardRepository: Repository<TCardTable>,
  tCard_id: number,
  status: StatusEnum
): Promise<{ success: boolean, message?: string }> {
  const updateResult = await tCardRepository.update(tCard_id, { status });

  // Проверяем, что обновление затронуло хотя бы одну запись
  if (updateResult.affected && updateResult.affected > 0) {
    console.log('Карта успешно обновлена с id:', tCard_id);
    return { success: true };
  } else {
    const error = `Ошибка при обновлении карты (id) ${tCard_id}`;
    console.error(error);
    return { success: false, message: error };
  }
}