
import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../db/utilites'

import { getUnits, getUnitLoads, getTCardOperations, getUnitActions } from './../../handlers/handlers-get';  // расчеты

import { UnitLoadTable } from '../../db/models/plan/unit_loads';

import { UnitTable } from '../../db/models/catalogs/units'

import { UnitActionTable } from '../../db/models/catalogs/unit_actions'
import { TCardOperationTable } from '../../db/models/data/t_card_operations'
import { UnitTypeEnum } from './../../types/types';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const unitRepository = getTypedRepository(db, 'UnitTable', UnitTable);
  const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
  const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);

  try {

    // userId, teamId в любом случае
    const { userId, teamId, unitId } = req.query;

    const unitIdNumber = Array.isArray(unitId)
      ? Number(unitId[0])
      : unitId !== undefined
        ? Number(unitId)
        : undefined;

    switch (req.method) {
      case 'GET':

        // запросим юнитов                
        const units = await getUnits(Number(teamId), unitRepository, unitIdNumber)
        // если отбор по юниту и он получен то проверим может это контролер
        const isControler = (unitIdNumber && units.length > 0) ? (units[0].type === UnitTypeEnum.control) : false
        // если это контролер то запросим всех юнитов поскольку проверяем его лоады а иначе оставим старый массив 
        const allunits = (isControler) ? await getUnits(Number(teamId), unitRepository) : units


        // запросим действия юнитов
        const unitActions_ = await getUnitActions(Number(teamId), unitActionsRepository, unitIdNumber)

        //  получим юниты с загрузкой  до планирования новой карты         
        const unitsLoads = await getUnitLoads(
          Number(teamId),
          allunits,
          unitLoadRepository,
          unitActionsRepository,
          isControler,)
        // запросим операции  чтобы дополнить информацию по лоадам
        const operIds = Array.from(new Set(unitsLoads.map(load => load.id_oper)));

        const opers = await getTCardOperations(operIds, tCardOperationsRepository)

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

      case 'POST':

        break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (loads-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}

export default withAuth(handler)