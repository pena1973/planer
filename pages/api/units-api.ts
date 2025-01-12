import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository, In } from 'typeorm';

import { UnitTable } from '@/pages/db/models/catalogs/units'

import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'


import { UnitItem, UnitActionItem, UnitBelongEnum, UnitTypeEnum } from '@/types';

interface RequestBody {
  unit: UnitItem;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(CompanyTable);
    const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);

    // userId, companyId в любом случае
    const { userId, companyId } = req.query;

    switch (req.method) {
      case 'GET':
        // Строим фильтр для поиска
        const filter: any = {};
        if (companyId) {
          filter.company_id = companyId;
        }

        // Выполняем запрос с фильтрацией
        const receivedUnits = await unitRepository.find({
          where: filter,  // Применяем фильтр к запросу
        });


        const unitIds = receivedUnits.map(unit => unit.id);
        const filter1: any = {};
        if (unitIds.length > 0) {
          filter1.unit_id = In(unitIds);  // Используем In() для фильтрации по массиву ID
        }

        // Выполняем запрос с фильтрацией
        const receivedActionsUnit = await unitActionsRepository.find({
          where: filter1,  // Применяем фильтр к запросу
        });

        console.log(receivedUnits);

        const units_ = receivedUnits
          .map(unit => {

            let actions: UnitActionItem[] = receivedActionsUnit
              .filter(unitAction => unitAction.unit_id === unit.id)
              .map(unitAction => {
                return ({
                  id: unitAction.id,
                  action: unitAction.action,
                  koef: unitAction.koef
                })
              })

            return {
              id: unit.id,
              title: unit.title,
              code: unit.code,
              actions: actions,
              retool: unit.retool, 
              modified: false, 
              belong: unit.belong as UnitBelongEnum,
              type: unit.type as UnitTypeEnum,
              coment: unit.coment
            };
          });

        // отправляем ответ
        res.status(200).json({
          success: true,
          units: units_,
        });

        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса:', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

