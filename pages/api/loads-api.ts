
import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/database';  // Импортируем функцию подключения
import { getUnits, getUnitLoads, getTCardOperations, getActions, getUnitActions } from '@/handlers/handlers-get';  // расчеты

import { UnitLoadTable } from '../../db/models/plan/unit_loads';

import { UnitTable } from '../../db/models/catalogs/units'
import { ActionTable } from '../../db/models/catalogs/actions';
import { UnitActionTable } from '../../db/models/catalogs/unit_actions'
import { TCardOperationTable } from '../../db/models/data/t_card_operations'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {

    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);


    // const unitCalendarRepository = dbConnection.getRepository(UnitCalendarTable);

    // userId, teamId в любом случае
    const { userId, teamId, tcardId } = req.query;

    switch (req.method) {
      case 'GET':
        // запросим юниты
        const units = await getUnits(Number(teamId), unitRepository)
        // Используем репозиторий для работы с сущностью TCardTable
        const actionsRepository = dbConnection.getRepository(ActionTable);


        // запросим действия юнитов
        const unitActions_ = await getUnitActions(Number(teamId), unitActionsRepository)

        //  получим юниты с загрузкой  до планирования новой карты         
        const unitsLoads = await getUnitLoads(units, unitLoadRepository)
        // запросим операции  чтобы дополнить информацию по лоадам
        const operIds = Array.from(new Set(unitsLoads.map(load => load.id_oper)));

        const opers = await getTCardOperations(operIds, tCardOperationsRepository)

        const unitsLoads_ = unitsLoads.map(lo => {
          const oper = opers.find(op => op.id === lo.id_oper);

          const unitAction = unitActions_.find(ac => ac.id === oper?.action.id && ac.unitId === lo.unit.id);

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
                koef: (unitAction) ? unitAction.koef : 1
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