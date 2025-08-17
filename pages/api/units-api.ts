import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../db/utilites'

import { getUnits } from './../../handlers/handlers-get';
import { updateUnits, updateUnitActions, updateExceptions } from './../../handlers/handlers-update';
import { UnitTable } from './../../db/models/catalogs/units'
import { ActionTable } from './../../db/models/catalogs/actions'
import { UnitActionTable } from './../../db/models/catalogs/unit_actions'
import { UnitExceptionTable } from './../../db/models/plan/unit_exceptions'

import { UnitItem, UnitActionItem, UnitExceptionItem } from './../../types/types';

interface RequestBody {
  userId: number,
  teamId: number,
  units: UnitItem[],
  unitActions: UnitActionItem[],
  exceptions: UnitExceptionItem[],
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  // const teamRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const unitRepository = getTypedRepository(db, 'UnitTable', UnitTable);
  const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
  const unitExceptionsRepository = getTypedRepository(db, 'UnitExceptionTable', UnitExceptionTable);

  try {

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
        const { units, exceptions, unitActions, userId, teamId } = req.body as RequestBody;

        // СПИСОК ЮНИТОВ

        const resUnit = await updateUnits(unitRepository, units, teamId)

        if (!resUnit.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUnit.message });
          return;
        }
        const savedUnits = resUnit.savedUnits as UnitItem[];

        //  заполнили id юнитов в действиях,  ищем по idc все что не имело unitId и заполняем id юнита
        const unitActions_ = unitActions.map(unitAction => {
          if (!unitAction.unitId) {
            const unit = savedUnits.find(un => un.idc === unitAction.unitIdc)
            if (unit) return { ...unitAction, unitId: unit.id }
            else return undefined;
          } else { return unitAction }
        }).filter(elem => elem !== undefined) as UnitActionItem[];

        //  заполнили id юнитов в исключениях ищем по idc все что не имело unitId
        const exceptions_ = exceptions.map(ex => {
          if (!ex.unitId) {
            const unit = savedUnits.find(un => un.idc === ex.unitIdc)
            if (unit) return { ...ex, unitId: unit.id }
            else return undefined;
          } else { return ex }
        }).filter(elem => elem !== undefined) as UnitExceptionItem[];

        // СПИСОК ДЕЙСТВИЙ ЮНИТОВ
        const resUnitActions = await updateUnitActions(
          unitActionsRepository,
          unitActions_,
          teamId)

        if (!resUnitActions.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUnitActions.message });
          return;
        }

        const savedUnitActions = resUnitActions.savedUnitActions as UnitActionItem[];


        // ОТКЛОНЕНИЯ ЮНИТА ОТ РАСПИСАНИЯ КОМПАНИИ

        const resEx = await updateExceptions(unitExceptionsRepository, exceptions_, teamId)

        if (!resEx.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resEx.message });
          return;
        }

        const savedUnitExceptions = resEx.savedUnitExceptions as UnitExceptionItem[];

        // отправляем ответ
        res.status(200).json({
          success: true,
          actions: savedUnitActions,
          units: savedUnits,
          exceptions: savedUnitExceptions,
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