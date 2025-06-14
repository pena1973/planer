import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnits } from './handlers-get';  // расчеты
import { updateUnits,updateUnitActions, updateExceptions} from './handlers-update';  // расчеты
import { Repository, In } from 'typeorm';

import { UnitTable } from '@/pages/db/models/catalogs/units'
import { TeamTable } from '@/pages/db/models/catalogs/teams'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { UnitExceptionTable } from '@/pages/db/models/plan/unit_exceptions'

import { UnitItem, UnitActionItem, UnitExceptionItem } from '@/types';

interface RequestBody {
  userId: number,
  teamId: number,
  units: UnitItem[],
  actions: UnitActionItem[],
  exceptions: UnitExceptionItem[],
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    // const teamcompaniesRepository = dbConnection.getRepository(TeamTable);
    const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);

     const { teamId: getTeamId } = req.query;

    switch (req.method) {
      case 'GET':
        const units__ = await getUnits(Number(getTeamId), unitRepository)

        units__.sort((a, b) => {
          // Проверяем, что id определено
          if (a.id === undefined || b.id === undefined) {
            return 0; // Если id не определено, оставляем элементы на своих местах
          }
          return a.id - b.id; // Сортировка по id
        });

        // отправляем ответ
        res.status(200).json({
          success: true,
          units: units__,
        });

        break;
      case 'POST':

        // Извлекаем данные из тела запроса
        const { units, exceptions, actions, userId, teamId } = req.body as RequestBody;

        // СПИСОК ЮНИТОВ

        const resUnit = await updateUnits(unitRepository, units, teamId)

        if (!resUnit.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUnit.message });
          return;
        }
        const savedUnits = resUnit.savedUnits as UnitTable[];

        const units_ = savedUnits
          .map(unit => {
            return {
              id: unit.id,
              idc: unit.idc,
              title: unit.title,
              code: unit.code,
              retool: unit.retool,
              modified: false,
              belong: unit.belong,
              type: unit.type,
              coment: unit.coment,
              active: unit.active,                
            } as UnitItem;
          });

        //  заполнили id юнитов в действиях,  ищем по idc все что не имело unitId и заполняем id юнита

        const actions_ = actions.map(action => {
          if (!action.unitId) {
            let unit = savedUnits.find(un => un.idc === action.unitIdc)
            if (unit) return { ...action, unitId: unit.id }
            else return undefined;
          } else { return action }
        }).filter(elem => elem !== undefined);

        //  заполнили id юнитов в исключениях ищем по idc все что не имело unitId
        const exceptions_ = exceptions.map(ex => {
          if (!ex.unitId) {
            let unit = savedUnits.find(un => un.idc === ex.unitIdc)
            if (unit) return { ...ex, unitId: unit.id }
            else return undefined;
          } else { return ex }
        }).filter(elem => elem !== undefined);

        // СПИСОК ДЕЙСТВИЙ ЮНИТОВ
        const resUnitActions = await updateUnitActions(
          unitActionsRepository,
          actions_,
          teamId)

        if (!resUnitActions.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUnitActions.message });
          return;
        }

        const savedUnitActions = resUnitActions.savedUnitActions as UnitActionTable[];

        const unitActions_ = savedUnitActions
          .map(unitAction => {
            return {
              id: unitAction.id,
              action: unitAction.action,
              koef: unitAction.koef,
              unitId: unitAction.unit_id,
              unitIdc: unitAction.unit_idc,
              idc: unitAction.idc,
            } as UnitActionItem;
          });

        // ОТКЛОНЕНИЯ ЮНИТА ОТ РАСПИСАНИЯ КОМПАНИИ

        const resEx = await updateExceptions(unitExceptionsRepository, exceptions_, teamId)

        if (!resEx.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resEx.message });
          return;
        }

        let unitExceptions_ = [] as UnitExceptionItem[];

        if (resEx.savedUnitExceptions) {
          unitExceptions_ = resEx.savedUnitExceptions
            .map(ex => {
              return {
                id: ex.id,
                date: ex.date.toLocaleDateString("en-CA"),
                timeFinish: ex.timeFinish,
                timeStart: ex.timeStart,
                type: ex.type,
                unitId: ex.unit_id,
              } as UnitExceptionItem;
            });
        }


        // отправляем ответ
        res.status(200).json({
          success: true,
          actions: unitActions_,
          units: units_,
          exceptions: unitExceptions_,
        });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (units-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler)