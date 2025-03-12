
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { getUnits, getUnitLoads } from './handlers-get';  // расчеты
import { planTCard } from './handlers-plan';  // планирование карты
import { getTCard, getTCardMatOper, getCompanyShedule, getExceptions } from './handlers-get';  // 


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


import {
  UnitItem,
  UnitActionItem, TCardProductItem, TCardOperationItem,
  TCardItem, UnitLoadItem,
  UnitBelongEnum, UnitTypeEnum,
  CalendarItem, TimeTypeEnum, StatusEnum
} from "@/types";

interface RequestBody {
  unitLoads: UnitLoadItem[];  // переобозвать и сделать плоскую таблицу
  tCard: TCardItem & { status: StatusEnum }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    const unitRepository = dbConnection.getRepository(UnitTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const companyScheduleRepository = dbConnection.getRepository(CompanyScheduleTable);
    const unitExceptionsRepository = dbConnection.getRepository(UnitExceptionTable);


    // userId, companyId в любом случае
    const { userId, companyId, tcardId, today } = req.query;

    switch (req.method) {
      // ПРЕДВАРИТЕЛЬНОЕ ПЛАНИРОВАНИЕ
      case 'GET':
        // получаем карту из базы  по id  со всеми параметрами    
        // let tCard1 = {} as TCardItem;

        let tCard_ = await getTCard(Number(tcardId), tCardRepository)
        if (!tCard_) {
          res.status(200).json({ success: false, error: "Карта с таким номером не найдена" });
          return
        }

        let { tCardMaterials, tCardOperations } = await getTCardMatOper(
          Number(tcardId), tCardOperationsRepository, tCardProductRepository)

        tCard_.tCardMaterials = [...tCardMaterials] as TCardProductItem[];
        tCard_.tCardOperations = [...tCardOperations] as TCardOperationItem[]

        // запросим юниты
        const units_ = await getUnits(Number(companyId), unitRepository, unitActionsRepository)

        // запросим расписание компании
        const shedule_ = await getCompanyShedule(Number(companyId), companyScheduleRepository)

        //  получим загрузку юнитов  до планирования новой карты         
        const unitLoadItems = await getUnitLoads(units_, unitLoadRepository)

        //  получим исключения рабочего времени юнитов         
        const exceptionItems = await getExceptions(Number(companyId), unitExceptionsRepository)


        // Планируем карту
        let resultPlaning = planTCard(tCard_, units_, shedule_, unitLoadItems, exceptionItems, today as string)
        //  Если не удалось запланировать
        if (!resultPlaning.success) {
          res.status(200).json({
            success: false,
            unitsLoads: unitLoadItems,
            message: resultPlaning.message,
          });
          break;
        }


        // Отправляем ответ с данными  в базе их нет это только драфт
        res.status(200).json({
          success: true,
          unitsLoads: resultPlaning.loads,
          messsage: resultPlaning.message,
        });
        break;

      // ЗАПИСЬ ЗАПЛАНИРОВАННОЙ КАРТЫ
      case 'POST':
        const { unitLoads, tCard } = req.body as RequestBody; //  загрузки по карте и только draft -  массив интервалов

        // СПИСОК Загрузок 
        const resLoads = await updateLoads(
          unitLoadRepository,
          unitLoads,
          Number(companyId)
        )
        if (!resLoads.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resLoads.message });
          return;
        }
        const savedUnitLoads = resLoads.savedUnitLoads as UnitLoadItem[];


        // Статус Карты 

        const resCard = await updateStatusCard(tCardRepository, tCard, StatusEnum.planed)
        if (!resCard.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resCard.message });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
          savedUnitLoads: savedUnitLoads,
        });
        break;


      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса ((preplan-api)):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}
// ЗАГРУЗКИ ЮНИТОВ ПО КАРТЕ
async function updateLoads(
  unitLoadRepository: Repository<UnitLoadTable>,
  loads: UnitLoadItem[],
  company_id: number
): Promise<{ success: boolean, savedUnitLoads?: UnitLoadItem[], message?: string }> {

  // СПИСОК ЗАГРУЗОК в базе по этой компании
  const existingLoads = await unitLoadRepository.find({ where: { company_id: company_id } });
  // удаленных загрузок здесь не будет потому что это может быть только при удалении операции 
  // (потом надо дописать при удалении в процессе редактуры тех карты)
  //  может быть только добавление новой и редактирование существующей загрузки


  // 2. Найдём новые загрузки которых нет в базестадии, которых нет в базе
  const loadsToAdd = loads.filter(load =>
    !existingLoads.some(existingLoad => existingLoad.id === load.id)
  );

  // 3. Найдём существующие загрузки для обновления
  const loadsToUpdate = loads.filter(load =>
    existingLoads.some(existingLoad => existingLoad.id === load.id)
  );


  // Добавляем новые Загрузки и меняем статус
  const newLoads = loadsToAdd.map(load => {
    return unitLoadRepository.create({

      date: load.date, // дата операции   
      idc_oper: load.idc_oper, // Идентификатор операции  
      id_tCard: load.id_tCard, // Идентификатор тех карты
      timeStart: load.timeStart, // Время начала в минутах
      timeFinish: load.timeFinish, // Время окончания в минутах
      company_id: company_id,
      unit_id: load.unit.id
    });
  });
  let savedNewLoads = [] as UnitLoadTable[]
  if (newLoads.length > 0) savedNewLoads = await unitLoadRepository.save(newLoads);
  if (!savedNewLoads) return { success: false, message: "Не удалось сохранить действие" }


  // Обновляем существующие загрузки
  const updatedLoads = loadsToUpdate.map(load => {
    const existingLoad = existingLoads.find(existingLoad => existingLoad.id === load.id);

    if (existingLoad) {
      // Обновляем нужные поля
      const [year, month, day] = load.date.split('-').map(Number);
      existingLoad.date = new Date(year, month - 1, day);
      existingLoad.timeFinish = load.timeFinish;
      existingLoad.timeStart = load.timeStart;
      if (load.unit) {
        existingLoad.unit_id = Number(load.unit.id);
      }
      return unitLoadRepository.create(existingLoad);
    }
    return null;
  }).filter(load => load !== null);

  let savedUpdatedLoads = [] as UnitLoadTable[]
  if (updatedLoads.length > 0) savedUpdatedLoads = await unitLoadRepository.save(updatedLoads);
  if (!savedUpdatedLoads) return { success: false, message: "Не удалось сохранить загрузки " }

  // Все действия сохранены, проверка
  let error = ""
  const savedLoads = [...savedNewLoads, ...savedUpdatedLoads] as UnitLoadTable[]

  // вход и выход массив операций не совпадает количество записей - чтото не сохранилось
  if (savedLoads.length > 0 && loads.length !== savedLoads.length) {
    error = `Не удалось сохранить действия`;
    //  console.log(error);
    return { success: false, message: error }
  }


  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedLoads.length > 0 && loads.length > 0) {
    if (savedLoads.length > 0) {

      savedLoads.forEach((load, index) => {

        if (load.id) {
          console.log(`Загрузка успешно сохранена с id: ${load.id}`);
        } else {
          error = `Ошибка при сохранении Загрузки ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить загрузки`;
      console.log(error);
      return { success: false, message: error }
    }
  }

  let savedUnitLoads = savedLoads.map(load => {
    let foundLoad = loads.find(lo => lo.idc_oper === load.idc_oper && lo.id_tCard === load.id_tCard)

    return {
      id: load.id,
      unit: (foundLoad) ? foundLoad.unit : {} as UnitItem,
      date: (new Date(load.date)).toLocaleDateString('en-CA'), //   перевели в строковый формат
      idc_oper: load.idc_oper,
      id_tCard: load.id_tCard,
      timeStart: load.timeStart,
      timeFinish: load.timeFinish,
      status: StatusEnum.planed
    } as UnitLoadItem
  })
  return { success: true, savedUnitLoads: savedUnitLoads, message: "" }
}
// ТКАРТА ОБНОВЛЯЮ СТАТУС
// 
async function updateStatusCard(
  tCardRepository: Repository<TCardTable>,
  tCard: TCardItem,
  status: StatusEnum
): Promise<{ success: boolean, message?: string }> {
  const updateResult = await tCardRepository.update(tCard.id, { status });

  // Проверяем, что обновление затронуло хотя бы одну запись
  if (updateResult.affected && updateResult.affected > 0) {
    console.log('Карта успешно обновлена с id:', tCard.id);
    return { success: true };
  } else {
    const error = `Ошибка при обновлении карты ${JSON.stringify(tCard)}`;
    console.error(error);
    return { success: false, message: error };
  }
}