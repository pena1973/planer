
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { delNextloads } from './handlers-plan';  // планирование карты
import { getTCard, getTCardMatOper } from './handlers-get';  // 

import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'

import { TCardProductItem, TCardOperationItem,UnitLoadItem,} from "@/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    //  const unitCalendarRepository = dbConnection.getRepository(UnitCalendarTable);

    // userId, companyId в любом случае

    const { userId, companyId } = req.query;

    switch (req.method) {
      case 'POST':
        // ПРЕДВАРИТЕЛЬНОЕ ПЛАНИРОВАНИЕ - удаление операции
        // если удалить один лоад то все зависимые тоже должны быть удалены для статусов prepared
        const deletedLoad = req.body.deletedLoad as UnitLoadItem;
        // лоады только по этой карте статусы все стираем только prepared 
        // если статус planed  смотрим на дату - больше сегодня - стираем историю отменяем
        const loads = req.body.loads as UnitLoadItem[]; 

        let tCard_ = await getTCard(Number(deletedLoad.id_tCard), tCardRepository)
        if (!tCard_) {
          res.status(200).json({ success: false, error: "Карта с таким номером не найдена" });
          return
        }

        let { tCardMaterials, tCardOperations } = await getTCardMatOper(
          Number(deletedLoad.id_tCard), tCardOperationsRepository, tCardProductRepository)
        tCard_.tCardMaterials = [...tCardMaterials] as TCardProductItem[];
        tCard_.tCardOperations = [...tCardOperations] as TCardOperationItem[]

        let oper = tCard_.tCardOperations.find(oper => oper.id === deletedLoad?.id_oper);
        if (oper) {
          // Стираю все зависимые лоады      
          let unitLoads_ = delNextloads(oper, tCard_, loads);

          //  Если не удалось стереть
          if (!unitLoads_) {
            res.status(200).json({
              success: false,
              unitsLoads: undefined,
            });
          }
          res.status(200).json({ success: true, unitsLoads: unitLoads_ });
        }
        break;

      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (erazeplan-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}
