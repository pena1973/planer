//pages/api/units-api
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';
import { getTypedRepository } from './../../db/utilites'

import { getUnits } from './../../handlers/handlers-get';
import { updateUnits, updateUnitActions, updateExceptions } from './../../handlers/handlers-update';
import { UnitTable } from './../../db/models/catalogs/units'
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
  try {

    const db = await connectDb();

    const unitRepository = getTypedRepository(db, 'UnitTable', UnitTable);
    const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
    const unitExceptionsRepository = getTypedRepository(db, 'UnitExceptionTable', UnitExceptionTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

    switch (req.method) {
      case 'GET':
        const { teamId: teamIdget, userId: userIdget } = req.query;
        const unitsGet = await getUnits(Number(userIdget), locale, Number(teamIdget), unitRepository)

        unitsGet.sort((a, b) => {
          if (a.id === undefined || b.id === undefined) {
            return 0; // Если id не определено, оставляем элементы на своих местах
          }
          return a.id - b.id; // Сортировка по id
        });

        res.status(200).json({
          success: true,
          units: unitsGet,
        });

        break;
      case 'POST':
        const { units, exceptions, unitActions, userId, teamId } = req.body as RequestBody;

        const resUnit = await updateUnits(Number(userId), locale, unitRepository, units, teamId)

        if (!resUnit.success) {
          res.status(200).json({
            success: false,
            message: resUnit.message,
          });
          break;
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
          Number(userId),
          locale,
          unitActionsRepository,
          unitActions_,
          teamId)

        if (!resUnit.success) {
          res.status(200).json({
            success: false,
            message: resUnitActions.message,
          });
          break;
        }

        const savedUnitActions = resUnitActions.savedUnitActions as UnitActionItem[];

        // ОТКЛОНЕНИЯ ЮНИТА ОТ РАСПИСАНИЯ КОМПАНИИ
        const resEx = await updateExceptions(Number(userId), locale, unitExceptionsRepository, exceptions_, teamId)

        if (!resEx.success) {
          res.status(200).json({
            success: false,
            message: resEx.message,
          });
          break;
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
      location: "pages/api/unit-actions-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)