
import { withAuth } from './../../lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../lib/db/utils'

import { getTCardOperationsByCardId } from './../../handlers/handlers-get';  // расчеты
import { } from './../../handlers/handlers-plan';  // планирование карты
import { updateStatusOperationsByOperIds,updateStatusTCard } from './../../handlers/handlers-update';  // 


import { Repository  } from 'typeorm';

import { UnitLoadTable } from './../../db/models/plan/unit_loads';
import { TeamScheduleTable } from './../../db/models/plan/team_schedule';
import { TCardTable } from './../../db/models/data/t_cards'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'
import {getStatusPriority} from "./../../lib/utils"

import {  UnitItem, TCardItem, UnitLoadItem, StatusEnum,TCardOperationItem} from "./../../types/types";

interface RequestBody {
  tCardLoads: UnitLoadItem[];  // запланированные лоады в статусе prepared  по данной карте
  tCard: TCardItem & { status: StatusEnum },
  teamId:number,
  userId:number
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
  const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
  const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

  try {
  
    switch (req.method) {
      // ЗАПИСЬ ЗАПЛАНИРОВАННОЙ КАРТЫ
      case 'POST':
        const { tCardLoads, tCard,teamId,userId } = req.body as RequestBody; //  загрузки по карте и только draft -  массив интервалов

        // tCardLoads- приходит только в статусе prepared, нужно считать остальное
        // СПИСОК Загрузок 
        // просто сохраняем в базу потому что это всегда новые подготовленные
        const resLoads = await saveLoads(
          unitLoadRepository,
          tCardLoads,
          Number(teamId)
        )
        if (!resLoads.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resLoads.message });
          return;
        }
        const savedUnitLoads = resLoads.savedUnitLoads as UnitLoadItem[];


        // Статус Операций  меняем на planed
        const savedOpersIds = Array.from(new Set(savedUnitLoads.map(load => load.id_oper)));

        const resOpers = await updateStatusOperationsByOperIds(tCardOperationsRepository, savedOpersIds, StatusEnum.planed)
        if (!resOpers.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOpers.message });
          return;
        }

        // проверяем все операции карты и если  статусы не ниже текущего  меняем статус самой карты
        const tCardOperations = await getTCardOperationsByCardId(tCard.id, tCardOperationsRepository)

        /////ПРОВЕРКА каждой операции на предмет статуса//////
        // получаю все операции и проверяю их статусы
        // Проверка всех операций карты: если все не ниже текущего статуса
        const isAllOperationsNotLowerThanStatus = tCardOperations.every(operation => {
          // Функция для рекурсивной проверки статуса
          const checkOperationStatus = (op: TCardOperationItem): boolean => {
            if (op.status === StatusEnum.defective) {
              const fixOperation = tCardOperations.find(o => o.fixOperIdc === op.idc);
              if (fixOperation) {
                // Если исправляющая операция тоже дефектная, продолжаем цепочку
                return checkOperationStatus(fixOperation);
              } else {
                // Если исправляющей операции нет или она не дефектная, возвращаем статус операции
                return getStatusPriority(op.status) >= getStatusPriority(StatusEnum.planed);
              }
            } else {
              // Если операция не дефектная, просто возвращаем её статус
              return getStatusPriority(op.status) >= getStatusPriority(StatusEnum.planed);
            }
          };

          // Применяем проверку для текущей операции
          return checkOperationStatus(operation);
        });

        const tCardStatus = (isAllOperationsNotLowerThanStatus) ? StatusEnum.planed : tCard.status
        /////////////////////
        // Статус Карты  меняем на planed если все операции не ниже текущего статуса

        const resCard = await updateStatusTCard(tCardRepository, tCard.id, tCardStatus)
        if (!resCard.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resCard.message });
          return;
        }

        // отправляем ответ
        res.status(200).json({
          success: true,
          tCardStatus: tCardStatus,
          savedUnitLoads: savedUnitLoads,
        });
        break;


      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса ((save-card-loads-api)):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' + error });
  }
}

// Запись новых лоадов
async function saveLoads(
  unitLoadRepository: Repository<UnitLoadTable>,
  loadsToAdd: UnitLoadItem[],
  teamId: number
): Promise<{ success: boolean, savedUnitLoads: UnitLoadItem[], message?: string }> {

  if (loadsToAdd.length === 0) { return { success: true, savedUnitLoads: [] as UnitLoadItem[], message: "" } }

  // Добавляем новые Загрузки и меняем статус
  const newLoads = loadsToAdd.map(load => {
    return unitLoadRepository.create({
      date: load.date,
      idc: load.idc,
      id_oper: load.id_oper,
      idc_oper: load.idc_oper, // Идентификатор операции  
      id_tCard: load.id_tCard, // Идентификатор тех карты
      timeStart: Math.ceil(load.timeStart), // Время начала в минутах окр в большую сторону
      timeFinish: Math.ceil(load.timeFinish), // Время окончания в минутах окр в большую сторону
      team_id: teamId,
      unit_id: load.unit.id,
      status: StatusEnum.planed,
      isActive: load.isActive,
      isRetool: load.isRetool,
      isPinned: load.isPinned,
      isOuterStart: load.isOuterStart,
      isOuterFinish: load.isOuterFinish,
      version: load.version,
      isFirst: load.isFirst,
    });
  });
  let savedNewLoads = [] as UnitLoadTable[]
  if (newLoads.length > 0) savedNewLoads = await unitLoadRepository.save(newLoads);
  if (!savedNewLoads) return { success: false, savedUnitLoads: [] as UnitLoadItem[], message: "Не удалось сохранить действие" }


  // // Все действия сохранены, проверка
  let error = ""
  // const savedLoads = [...savedNewLoads, ...savedUpdatedLoads] as UnitLoadTable[]

  // вход и выход массив операций не совпадает количество записей - чтото не сохранилось
  if (savedNewLoads.length > 0 && loadsToAdd.length !== savedNewLoads.length) {
    error = `Не удалось сохранить все загрузки`;
    return { success: false, savedUnitLoads: [] as UnitLoadItem[], message: error }
  }

  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedNewLoads.length > 0) {
    savedNewLoads.forEach((load, index) => {
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
    return { success: false, savedUnitLoads: [] as UnitLoadItem[], message: error }
  }

  const savedUnitLoads = savedNewLoads.map(loadT => {
    const load = loadsToAdd.find(lo => lo.id_oper === loadT.id_oper && lo.idc === loadT.idc)
    return {
      id: loadT.id,
      idc: loadT.idc,
      unit: (load) ? load.unit as UnitItem : {} as UnitItem,
      date: String(loadT.date), //   перевели в строковый формат
      idc_oper: loadT.idc_oper,
      id_oper: loadT.id_oper,
      id_tCard: loadT.id_tCard,
      timeStart: loadT.timeStart,
      timeFinish: loadT.timeFinish,
      status: loadT.status,
      isActive: loadT.isActive,
      isRetool: loadT.isRetool,
      loadInfo: (load) ? load.loadInfo : undefined,
      isPinned: loadT.isPinned,//  перенесен вручшую на шкале
      isOuterStart: loadT.isOuterStart,//  это старт оутсортера
      isOuterFinish: loadT.isOuterFinish,
      version: loadT.version,
      isFirst: loadT.isFirst,
    } as UnitLoadItem
  })
  return { success: true, savedUnitLoads: savedUnitLoads, message: "" }
}

// // ТКАРТА ОБНОВЛЯЮ СТАТУС
// // 
// async function updateStatusCard(
//   tCardRepository: Repository<TCardTable>,
//   tCard: TCardItem,
//   status: StatusEnum
// ): Promise<{ success: boolean, message?: string }> {
//   const updateResult = await tCardRepository.update(tCard.id, { status });

//   // Проверяем, что обновление затронуло хотя бы одну запись
//   if (updateResult.affected && updateResult.affected > 0) {
//     // console.log('Карта успешно обновлена с id:', tCard.id);
//     return { success: true };
//   } else {
//     const error = `Ошибка при обновлении карты ${JSON.stringify(tCard)}`;
//     // console.error(error);
//     return { success: false, message: error };
//   }
// }

// // Операции ОБНОВЛЯЮ СТАТУС

// export async function updateStatusOperationsByOperIds(
//   tCardOperationsRepository: Repository<TCardOperationTable>,
//   opersIds: number[],
//   status: StatusEnum
// ): Promise<{ success: boolean, message?: string }> {
  
//   if (opersIds.length===0) return { success: true };
  
//   try {
//     const updateResult = await tCardOperationsRepository.update(
//       { id: In(opersIds) },
//       { status }
//     );

//     if (updateResult.affected && updateResult.affected > 0) {
//       // console.log('Операции успешно обновлены:', opersIds);
//       return { success: true };
//     } else {
//       const error = `Ошибка: операции с id ${JSON.stringify(opersIds)} не найдены или не обновлены.`;
//       // console.error(error);
//       return { success: false, message: error };
//     }
//   } catch (error: any) {
//     // console.error("Ошибка при обновлении операций:", error);
//     return { success: false, message: error.message || "Ошибка при обновлении операций." };
//   }
// }

export default withAuth(handler)
