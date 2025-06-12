import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { getUnits, getUnitLoads, getTeamShedule, getExceptions } from './handlers-get';  // 
import { getUnitsSchedule } from './handlers-schedule';  // 

import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitLoadTable } from '@/pages/db/models/plan/unit_loads';
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { UnitTable } from '@/pages/db/models/catalogs/units'
import { TeamScheduleTable } from '@/pages/db/models/plan/team_schedule'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions'

import { UnitCalendarItem, UnitLoadItem, StatusEnum, UnitItem, UnitKPIItem } from "@/types";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const teamRepository = dbConnection.getRepository(TeamTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const unitRepository = dbConnection.getRepository(UnitTable);

    const teamScheduleRepository = dbConnection.getRepository(TeamScheduleTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);
    // userId, teamId в любом случае
    const { userId, teamId, today, unitId, dateFrom, dateTo, month } = req.query;

    switch (req.method) {
      case 'GET':

        // запросим юниты
        const units = await getUnits(Number(teamId), unitRepository)

        // Применяем фильтр  если есть    
        let filteredUnits = units;
        if (unitId) filteredUnits = units.filter(unit => unit.id === Number(unitId));

        // запросим лоады по юнитам
        const unitLoads = await getUnitLoads(filteredUnits, unitLoadRepository)

        // запросим расписание команды
        const schedule = await getTeamShedule(Number(teamId), teamScheduleRepository)

        // запросим исключения расписания по юнитам

        const exceptions = await getExceptions(Number(teamId), unitExceptionsRepository)

        // запросим расписание юнитов по дням
        const unitShedule = getUnitsSchedule(String(today), schedule, exceptions, filteredUnits)

        // рассчитываем производственное время юнита его загруженность и результат
        const unitsKPI = getDailyProductionSummary(
          Number(teamId),
          unitShedule,
          unitLoads,
          (dateFrom) ? String(dateFrom) : undefined,
          (dateTo) ? String(dateTo) : undefined,
          (month) ? Number(month) : undefined,
        );

        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          unitsKPI: unitsKPI,
          messsage: ""
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (report-units-kpi-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export function getDailyProductionSummary(
  teamId: number,
  unitSchedule: UnitCalendarItem[],
  unitLoads: UnitLoadItem[],
  dateFrom: string | undefined,
  dateTo: string | undefined,
  month: number | undefined
): UnitKPIItem[] {

  const result: UnitKPIItem[] = [];

  // Проходим по каждому элементу расписания для юнита
  for (let i = 0; i < unitSchedule.length; i++) {
    const dayItem = unitSchedule[i];
    if (dateFrom && dayItem.date.toLocaleDateString('en-CA') < dateFrom) continue;
    if (dateTo && dayItem.date.toLocaleDateString('en-CA') > dateTo) continue;
    if (month && dayItem.date.getMonth() !== month) continue;

    // Переводим дату в формат "YYYY-MM-DD"
    const dayStr = dayItem.date.toLocaleDateString("en-CA");

    // Вычисляем производственное время:
    // Производственное время = (timeFinishWork - timeStartWork) мин минус общая длительность всех перерывов
    const breakDuration = dayItem.breaks.reduce((sum, br) => sum + (br.timeFinish - br.timeStart), 0);
    const productionTime = (dayItem.timeFinishWork - dayItem.timeStartWork) - breakDuration;

    if (productionTime <= 0) continue;

    // Фильтруем загрузки для данного дня и данного юнита:
    const loadsForDay = unitLoads.filter(load =>
      load.date === dayStr && load.unit.id === dayItem.unit.id
    );

    // Определяем время, занятое лоадами (statuses: planed, ready, performed, defective)
    const occupiedTime = loadsForDay
      .filter(load =>
        [StatusEnum.planed, StatusEnum.ready, StatusEnum.performed, StatusEnum.defective].includes(load.status)
      )
      .reduce((sum, load) => sum + (load.timeFinish - load.timeStart), 0);

    // Определяем результативное время (statuses: ready, performed)
    const effectiveTime = loadsForDay
      .filter(load => [StatusEnum.ready, StatusEnum.performed].includes(load.status))
      .reduce((sum, load) => sum + (load.timeFinish - load.timeStart), 0);

    // Определяем время брака (status: defective)
    const defectTime = loadsForDay
      .filter(load => load.status === StatusEnum.defective)
      .reduce((sum, load) => sum + (load.timeFinish - load.timeStart), 0);

    // Определяем время запланированного (status: planed)
    const planedTime = loadsForDay
      .filter(load => load.status === StatusEnum.planed)
      .reduce((sum, load) => sum + (load.timeFinish - load.timeStart), 0);

    result.push({
      unit: dayItem.unit,
      date: dayStr,
      productionTime,
      occupiedTime,
      planedTime,
      effectiveTime,
      defectTime
    });
  };

  result.sort((a, b) => {
    // Сначала сортируем по unit.id, если они заданы, иначе по unit.title
    const unitA = a.unit.id ?? a.unit.title;
    const unitB = b.unit.id ?? b.unit.title;

    if (unitA > unitB) return 1;
    if (unitA < unitB) return -1;
    // Если юниты равны, сортируем по дате (формат "YYYY-MM-DD" корректно сравнивается как строка)
    return a.date.localeCompare(b.date);
  });
  return result;
}
