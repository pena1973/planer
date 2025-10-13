// pages/api/loads-api.ts
// API для получения загрузок юнитов (unit loads)
// Используется в настройках команд (TeamSettings) и при создании/редактировании карт (TCardForm)
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getLocaleFromHeader } from './../../lib/server/locale';

import { getTypedRepository } from './../../db/utilites'
import { getUnits, getUnitLoads, getTCardOperations, getUnitActions } from './../../handlers/handlers-get';  // расчеты
import { UnitLoadTable } from '../../db/models/plan/unit_loads';
import { UnitTable } from '../../db/models/catalogs/units'
import { UnitActionTable } from '../../db/models/catalogs/unit_actions'
import { TCardOperationTable } from '../../db/models/data/t_card_operations'
import { UnitTypeEnum } from './../../types/types';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  try {

    const db = await connectDb();
    const unitRepository = getTypedRepository(db, 'UnitTable', UnitTable);
    const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
    const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
    const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    const t = getServerT(locale, 'sermes');

    switch (req.method) {
      case 'GET':
        const { userId, teamId, unitId } = req.query;
        // запросим юнитов                
        const units = await getUnits(Number(userId), locale, Number(teamId), unitRepository, (unitId) ? Number(unitId) : undefined)

        // если отбор по юниту и он получен то проверим может это контролер
        const isControler = (unitId && units.length > 0) ? (units[0].type === UnitTypeEnum.control) : false;

        // если это контролер то запросим всех юнитов поскольку проверяем его лоады а иначе оставим старый массив 
        const allunits = (isControler) ? await getUnits(Number(userId), locale, Number(teamId), unitRepository) : units

        // запросим действия юнитов
        const unitActions_ = await getUnitActions(Number(userId), locale, Number(teamId), unitActionsRepository, Number(unitId))

        //  получим юниты с загрузкой  до планирования новой карты         
        const unitsLoads = await getUnitLoads(
          Number(userId),
          locale,
          Number(teamId),
          allunits,
          unitLoadRepository,
          unitActionsRepository,
          isControler,)

        // запросим операции  чтобы дополнить информацию по лоадам
        const operIds = Array.from(new Set(unitsLoads.map(load => load.id_oper)));

        const opers = await getTCardOperations(Number(userId), locale, operIds, tCardOperationsRepository)

        const unitsLoads_ = unitsLoads.map(lo => {
          const oper = opers.find(op => op.id === lo.id_oper);

          const unitAction = unitActions_.find(ac => {
            return (ac.action.id === oper?.action.id && ac.unitId === lo.unit.id)
          });

          if (!oper) return { ...lo }

          {
            return {
              ...lo,
              loadInfo: {
                tCardIdc: lo.loadInfo.tCardIdc,
                tCardDate: lo.loadInfo.tCardDate,
                title: oper.action.title,
                duration: Math.round(oper.duration / 60000), // инфо показываем в минутах
                interruptible: oper.action.interruptible,
                koef: (unitAction) ? unitAction.koef : 1.00
              },
            }
          }
        })

        // Отправляем ответ с данными  в базе их нет это только драфт
        res.status(200).json({
          success: true,
          units: units,
          unitsLoads: unitsLoads_,
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
      location: "pages/api/loads-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)