
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnits, getUnitLoads } from './handlers-get';  // расчеты

import { UnitLoadTable } from '@/pages/db/models/plan/unit-loads';

import { UnitTable } from '@/pages/db/models/catalogs/units'

import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'


// import {
//   TCardProductItem, TCardOperationItem,
//   TCardItem, UnitLoadItem,
//   UnitBelongEnum, UnitTypeEnum,
//   CalendarItem, TimeTypeEnum, LoadItem
// } from "@/types";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try{
  
  // Убедимся, что подключение установлено    
  const dbConnection = await connectDb();  // Получаем подключение

  const unitRepository = dbConnection.getRepository(UnitTable);
  const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
  const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
 

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
} catch (error) {
  console.error('Ошибка подключения или выполнения запроса (unit-api):', error);
  res.status(500).json({ error: 'Не удалось обработать запрос' + error });
}
}

