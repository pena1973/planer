
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
    const companyScheduleRepository = dbConnection.getRepository(CompanyScheduleTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);
    // userId, companyId в любом случае

    const { userId, companyId } = req.query;

    switch (req.method) {

      // ПЕРЕПЛАНИРОВАНИЕ
      case 'POST':
        const { pinnedLoad, loads, unit, date, timeStart, timeFinish, today } = req.body as RequestBody; //  загрузки по карте и только draft -  массив интервалов
        // loads-Это все загрузки по карте которую перепланируем
        if (loads.length === 0) {
          // должно быть хотябы один лоад при перемешении
          // Если нет загрузок, можно вернуть пустой результат или обработать ошибку
          res.status(200).json({
            success: false,
            cardLoads: loads,
            message: "Ошибка, не передано загрузок по карте",
          });
          return;
        }
        // Формируем массив по карте без лоадов этой операции
        let cardLoads = loads.filter(load => load.id_oper !== pinnedLoad.id_oper);
        // выбираем все лоады по этой операции
        let operloads = loads.filter(load => load.id_oper === pinnedLoad.id_oper);
        // сортируем по возрастанию
        operloads.sort((a, b) =>
          a.date.localeCompare(b.date) || a.timeStart - b.timeStart
        );

        let loadStart = operloads[0];
        let loadFinish = operloads[operloads.length - 1];

        // получаем полную карту со всеми входящими и исходящими
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

          // 1. если перетаскиваем с внутреннего на внешний
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
            const timeStartRes = getFinishOperations(previousOpersIdcs, loads, date);
            if (!timeStartRes) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Источник и результат карты не согласован С-" + tCard.number,
              });
              return
            }
            //  момент возможного выполнения операции (закончены все предыдущие)         
            const correctRes = getLaterDateTime(timeStartRes, { date: date, time: timeStart });

            // Формируем стартовый лоад и добавляем в лоады карты
            cardLoads.push(
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

            //  момент завершения операции оставляем тот же            
            const timeFihishRes = getLastLoadFinish(operloads)
            if (!timeFihishRes) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Источник и результат карты не согласован С-" + tCard.number,
              });
              return
            }

            // Формируем финишный лоад 
            cardLoads.push(
              {
                ...loadFinish,
                unit: unit,
                isRetool: false,
                date: timeFihishRes.date,
                timeStart: timeFihishRes.time - 5,
                timeFinish: timeFihishRes.time,
                isPinned: true,
                isOuterFinish: true,
                loadInfo: (loadFinish.loadInfo) ? { ...loadFinish.loadInfo, koef: 1 } : undefined
              })
            //
            // перепланируем зависимые
            // Далее перепланируем начиная с последующих операций

            // запросим юниты
            const units_ = await getUnits(Number(companyId), unitRepository, unitActionsRepository)

            // запросим расписание компании
            const shedule_ = await getCompanyShedule(Number(companyId), companyScheduleRepository)

            //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
            const unitLoadItemsBD = await getUnitLoads(units_, unitLoadRepository)
            //  уберем из нее лоады нашей карты
            let unitLoadItemsFull = unitLoadItemsBD.filter(lo => pinnedLoad.id_tCard !== lo.id)
            //  и добавим скорректированную
            unitLoadItemsFull = [...unitLoadItemsFull, ...cardLoads];

            //  получим исключения рабочего времени юнитов         
            const exceptionItems = await getExceptions(Number(companyId), unitExceptionsRepository)


            // Планируем карту начиная с нашей операции 
            let resultPlaning = planTCardFromOper(oper, tCard, units_, shedule_, unitLoadItemsFull, exceptionItems, today)
            //  Если не удалось запланировать
            if (!resultPlaning.success) {
              res.status(200).json({
                success: false,
                unitsLoads: cardLoads,
                message: resultPlaning.message,
              });
              break;
            }
            cardLoads = resultPlaning.loads.filter(lo => lo.id_tCard === tCard.id)

          }

          // 2. перетаскиваем с внешнего на внешний и если корректируемый лоад уже стартовый 
          if ((pinnedLoad.isOuterStart && pinnedLoad.unit.belong === UnitBelongEnum.outer)) {

            // проверяем чтобы начало не было позже хваста операции
            let finishLoad = loads.find(lo => lo.id_oper === pinnedLoad.id_oper && lo.isOuterFinish);
            if (!finishLoad) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Не найден лоад окончания операции С-" + tCard.number,
              });
              return
            }

            if (finishLoad.date < date || finishLoad.date === date && finishLoad.timeFinish < timeStart) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Нельзя начало операции сделать позже окончания операции С-" + tCard.number,
              });
              return
            }

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
            cardLoads.push(
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
            cardLoads.push(loadFinish);
          }

          // 3. перетаскиваем с внешнего на внешний и если корректируемый лоад уже финишный
          if ((pinnedLoad.isOuterFinish && pinnedLoad.unit.belong === UnitBelongEnum.outer)) {
          
            // проверяем чтобы начало не было позже хваста операции
            let startLoad = loads.find(lo => lo.id_oper === pinnedLoad.id_oper && lo.isOuterStart);
            if (!startLoad) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Не найден лоад начала операции С-" + tCard.number,
              });
              return
            }

            if (startLoad.date > date || startLoad.date === date && startLoad.timeStart > timeStart) {
              res.status(200).json({
                success: false,
                unitsLoads: loads,
                message: "Нельзя начало операции сделать позже окончания операции С-" + tCard.number,
              });
              return
            }

            //  стартовый оставляю как есть            
            cardLoads.push(loadStart);
            //  финишный меняю дату время 
            cardLoads.push(
              {
                ...loadFinish,
                date: date,
                unit: unit,
                isRetool: false,
                timeStart: timeFinish - 5,
                timeFinish: timeFinish,
                isPinned: true,
                isOuterFinish: true,
                loadInfo: (loadFinish.loadInfo) ? { ...loadFinish.loadInfo, koef: 1 } : undefined
              })


            // Далее перепланируем начиная с последующих операций

            // запросим юниты
            const units_ = await getUnits(Number(companyId), unitRepository, unitActionsRepository)

            // запросим расписание компании
            const shedule_ = await getCompanyShedule(Number(companyId), companyScheduleRepository)

            //  получим загрузку юнитов уже записанных в базе (планирован выполнен готов  и проч)
            const unitLoadItemsBD = await getUnitLoads(units_, unitLoadRepository)
            //  уберем из нее лоады нашей карты
            let unitLoadItemsFull = unitLoadItemsBD.filter(lo => pinnedLoad.id_tCard !== lo.id)
            //  и добавим скорректированные лоады карты
            unitLoadItemsFull = [...unitLoadItemsFull, ...cardLoads];

            //  получим исключения рабочего времени юнитов         
            const exceptionItems = await getExceptions(Number(companyId), unitExceptionsRepository)

            // Планируем карту начиная с нашей операции 
            let resultPlaning = planTCardFromOper(oper, tCard, units_, shedule_, unitLoadItemsFull, exceptionItems, today)
            //  Если не удалось запланировать
            if (!resultPlaning.success) {
              res.status(200).json({
                success: false,
                unitsLoads: cardLoads,
                message: resultPlaning.message,
              });
              break;
            }
            cardLoads = resultPlaning.loads.filter(lo => lo.id_tCard === tCard.id)
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
          unitsLoads: cardLoads,
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

function getLastLoadFinish(operloads: UnitLoadItem[]): { date: string; time: number } | undefined {
  if (operloads.length === 0) return undefined;
  // Инициализируем первый элемент как "наиболее поздний"
  let lastLoad = operloads[0];
  for (const load of operloads) {
    // Сравниваем даты, так как формат "YYYY-MM-DD" корректно сравнивается лексикографически
    if (load.date > lastLoad.date) {
      lastLoad = load;
    } else if (load.date === lastLoad.date && load.timeFinish > lastLoad.timeFinish) {
      lastLoad = load;
    }
  }
  return { date: lastLoad.date, time: lastLoad.timeFinish };
}
