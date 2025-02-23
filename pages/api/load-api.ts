
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnits, getUnitLoads } from './handlers-get';  // расчеты
import { planTCard } from './handlers-plan';  // планирование карты
import { getTCard, getTCardMatOper } from './handlers-get';  // 


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


// import {
//   TCardProductItem, TCardOperationItem,
//   TCardItem, UnitLoadItem,
//   UnitBelongEnum, UnitTypeEnum,
//   CalendarItem, TimeTypeEnum, LoadItem
// } from "@/types";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDb();
  // Убедимся, что подключение установлено    
  const dbConnection = await connectDb();  // Получаем подключение

  const unitRepository = dbConnection.getRepository(UnitTable);
  const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
  const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
  const tCardRepository = dbConnection.getRepository(TCardTable);
  const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
  const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);


  // const unitCalendarRepository = dbConnection.getRepository(UnitCalendarTable);

  // userId, companyId в любом случае
  const { userId, companyId, tcardId } = req.query;

  switch (req.method) {
    case 'GET':
          // запросим юниты
      const units = await getUnits(Number(companyId), unitRepository, unitActionsRepository)

      //  получим юниты с загрузкой  до планирования новой карты   
      //   UnitLoadItem
      const unitsLoads = await getUnitLoads(units, unitLoadRepository)

    
      // Отправляем ответ с данными  в базе их нет это только драфт
      res.status(200).json({
        success: true,
        units: units,
        unitsLoads: unitsLoads,
      });
      break;

    case 'POST':
      // const {email,login,pass,loginhash,locale,cookieagree,role,confirmed,coment,company_id } = req.body;
      // const newUser = userRepository.create({ email, login, pass,loginhash,locale,cookieagree,role,confirmed,coment,company_id });
      // await userRepository.save(newUser);
      // res.status(201).json(newUser);
      break;
    default:
      res.status(405).end(); // Метод не поддерживается
  }
}

