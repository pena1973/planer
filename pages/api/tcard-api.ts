import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardStageTable } from '@/pages/db/models/data/t_card_stages'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { CompanyTable } from '@/pages/db/models/catalogs/companies'

import { TypeEnum } from '@/pages/db/models/emums';
import { TCardItem, TCardProductItem, TCardOperationItem, TCardStageItem } from '@/types';

interface RequestBody {
  tCard: TCardItem;
  tCardMaxIdc: number;
  tCardProducts: TCardProductItem[];
  tCardWastes: TCardProductItem[];
  tCardMaterials: TCardProductItem[];
  tCardOperations: TCardOperationItem[];
  tCardStages: TCardStageItem[];
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const companiesRepository = dbConnection.getRepository(CompanyTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    // const tCardOrderedProductRepository = dbConnection.getRepository(TCardOrderedProductTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const tCardStagesRepository = dbConnection.getRepository(TCardStageTable);

    // userId, companyId в любом случае
    const { userId, companyId, tcardId } = req.query;

    switch (req.method) {
      case 'GET':

        // Строим фильтр для поиска по id карты
        const filter: any = {};

        if (tcardId) {
          filter.id = tcardId;
        }

        // Получаем карту по id
        const tCardtab = await tCardRepository.findOne({
          where: filter,  // Применяем фильтр к запросу
          relations: ['company', 'user'],  // Указываем связанные таблицы (если необходимо)
        });

        // Проверяем, что карта существует
        if (!tCardtab) {
          return res.status(404).json({ error: 'Card not found' });
        }

        // Получаем связанные данные: стадию, операции, продукты, отходы и материалы
        const tCardStagestab = await tCardStagesRepository.find({ where: { tcard_id: tCardtab.id } });
        const tCardOperationstab = await tCardOperationsRepository.find({ where: { tcard_id: tCardtab.id } });
        const tCardProductstab = await tCardProductRepository.find({ where: { tcard_id: tCardtab.id } });

        // Формируем нужный ответ

        // Преобразуем карты    
        const tCardItemg_ = {
          id: tCardtab.id,
          date: tCardtab.date,
          number: tCardtab.number || "1",  // Если number не заполнен, возвращаем "1"
          modified: true,  // Например, помечаем, что карта изменена
          maxId: tCardtab.max_idc,
          coment: tCardtab.coment,
        };

        // Преобразуем стадии    
        const tCardStagesg_ = tCardStagestab.map(stage => ({
          id: stage.id,
          idc: stage.idc,
          code: stage.code,
        }));

        // Преобразуем продукты
        const tCardProductsg_ = tCardProductstab
          .filter(product => product.type === TypeEnum.P)
          .map(product => {
            return {
              id: product.id,
              idc: product.idc,
              codeS: product.code_s,  // Используем code_s вместо codeS
              title: product.title,
              qtu: product.qtu,
              uom: product.uom,  // Преобразуем UOMsTable в UOMItem
            };
          });

        // Преобразуем отходы
        const tCardWastesg_ = tCardProductstab
          .filter(product => product.type === TypeEnum.W)
          .map(product => {
            return {
              id: product.id,
              idc: product.idc,
              codeS: product.code_s,  // Используем code_s вместо codeS
              title: product.title,
              qtu: product.qtu,
              uom: product.uom,  // Преобразуем UOMsTable в UOMItem
            };
          });

        // Преобразуем материалы
        const tCardMaterialsg_ = tCardProductstab
          .filter(product => product.type === TypeEnum.M)
          .map(product => {
            return {
              id: product.id,
              idc: product.idc,
              codeS: product.code_s,  // Используем code_s вместо codeS
              title: product.title,
              qtu: product.qtu,
              uom: product.uom,  // Преобразуем UOMsTable в UOMItem
            };
          });


        // Преобразуем операции
        const tCardOperationsg_ = tCardOperationstab
          .map(oper => {
            const staget = tCardStagestab.find(stage => stage.id === oper.stage_id) as TCardStageTable
            const stage = { id: staget.id, idc: staget.idc, code: staget.code } as TCardStageItem

            const inn = tCardProductstab
              .filter(product => { return (product.operation_id === oper.id && product.type === TypeEnum.I) })
              .map(product => {
                return {
                  id: product.id,
                  idc: product.idc,
                  codeS: product.code_s,
                  title: product.title,
                  qtu: product.qtu,
                  uom: product.uom,
                };
              });

            const out = tCardProductstab
              .filter(product => { return (product.operation_id === oper.id && product.type === TypeEnum.O) })
              .map(product => {
                return {
                  id: product.id,
                  idc: product.idc,
                  codeS: product.code_s,
                  title: product.title,
                  qtu: product.qtu,
                  uom: product.uom,  // Преобразуем UOMsTable в UOMItem
                };
              });

            return {
              id: oper.id,
              idc: oper.idc,
              stage: stage,
              out: out,
              inn: inn,
              action: { id: oper.action.id, title: oper.action.title },
              duration: oper.duration, // в милисекундах   
            };
          });

        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          tCard: tCardItemg_,
          tCardMaxIdc: tCardItemg_.maxId,
          tCardProducts: tCardProductsg_,
          tCardWastes: tCardWastesg_,
          tCardMaterials: tCardMaterialsg_,
          tCardOperations: tCardOperationsg_,
          tCardStages: tCardStagesg_,
        });
        break;

      case 'POST':

        // Извлекаем данные из тела запроса
        const {
          tCard,
          tCardMaxIdc,
          tCardProducts,
          tCardWastes,
          tCardMaterials,
          tCardOperations,
          tCardStages,
        } = req.body as RequestBody;

        const resCard = await updateCard(tCardRepository, tCard, Number(userId), Number(companyId), tCardMaxIdc)

        if (!resCard.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resCard.message });
          return;
        }
        const savedTCard = resCard.savedTCard as TCardTable;

        // СПИСОК СТАДИЙ  
        const resStages = await updateStages(
          tCardStagesRepository,
          tCardOperationsRepository,
          tCardProductRepository,
          tCardStages,
          savedTCard)
        if (!resStages.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resStages.message });
          return;
        }

        const savedTCardStages = resStages.savedTCardStages as TCardStageTable[];

        //СПИСОК ОПЕРАЦИЙ

        const resOperations = await updateOperations(tCardOperationsRepository, tCardProductRepository, tCardOperations, savedTCard, savedTCardStages)
        if (!resOperations.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOperations.message });
          return;
        }
        const savedTCardOperations = resOperations.savedTCardOperations as TCardOperationTable[];


        //СПИСОК ПРОДУКТОВ

        const resProducts = await updateProducts(tCardProductRepository, tCardProducts, savedTCard, savedTCardOperations, tCardMaterials, tCardWastes, tCardOperations)
        if (!resOperations.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOperations.message });
          return;
        }
        const savedTCardProducts = resProducts.savedTCardProducts as TCardProductTable[];

        // если дошли сюда значит при сохранении ничего не слетело 
        //  преобразуем  записи таблиц в наши типы но только с указанием id базы

        const tCardStages_ = savedTCardStages
          .map(stage => { return { id: stage.id, idc: stage.idc, code: stage.code, mode: false }; });

        const tCardProducts_ = savedTCardProducts
          .filter(product => product.type === TypeEnum.P)
          .map(product => {
            return {
              id: product.id,
              idc: product.idc,
              codeS: product.code_s,  // Используем code_s вместо codeS
              title: product.title,
              qtu: product.qtu,
              uom: product.uom,  // Преобразуем UOMsTable в UOMItem
            };
          });

        const tCardWastes_ = savedTCardProducts
          .filter(product => product.type === TypeEnum.W)
          .map(product => {
            return {
              id: product.id,
              idc: product.idc,
              codeS: product.code_s,  // Используем code_s вместо codeS
              title: product.title,
              qtu: product.qtu,
              uom: product.uom,  // Преобразуем UOMsTable в UOMItem
            };
          });

        const tCardMaterials_ = savedTCardProducts
          .filter(product => product.type === TypeEnum.M)
          .map(product => {
            return {
              id: product.id,
              idc: product.idc,
              codeS: product.code_s,  // Используем code_s вместо codeS
              title: product.title,
              qtu: product.qtu,
              uom: product.uom,  // Преобразуем UOMsTable в UOMItem
            };
          });

        const tCardOperations_ = savedTCardOperations
          .map(oper => {
            const staget = savedTCardStages.find(stage => stage.id === oper.stage_id) as TCardStageTable
            const stage = { id: staget.id, idc: staget.idc, code: staget.code } as TCardStageItem

            const inn = savedTCardProducts
              .filter(product => { return (product.operation_id === oper.id && product.type === TypeEnum.I) })
              .map(product => {
                return {
                  id: product.id,
                  idc: product.idc,
                  codeS: product.code_s,
                  title: product.title,
                  qtu: product.qtu,
                  uom: product.uom,
                };
              });

            const out = savedTCardProducts
              .filter(product => { return (product.operation_id === oper.id && product.type === TypeEnum.O) })
              .map(product => {
                return {
                  id: product.id,
                  idc: product.idc,
                  codeS: product.code_s,
                  title: product.title,
                  qtu: product.qtu,
                  uom: product.uom,  // Преобразуем UOMsTable в UOMItem
                };
              });

            return {
              id: oper.id,
              idc: oper.idc,
              stage: stage,
              out: out,
              inn: inn,
              action: { id: oper.action.id, title: oper.action.title },
              duration: oper.duration, // в милисекундах   
            };
          });

        const tCardItem_ = {
          id: savedTCard.id,
          date: savedTCard.date,
          active: true,
          number: savedTCard.number,
          modified: false, // Например, установка true, так как мы только что сохранили
          maxId: savedTCard.max_idc,
          coment: savedTCard.coment,
        };

        // отправляем ответ
        res.status(200).json({
          success: true,
          tCard: tCardItem_,
          tCardMaxIdc: tCardItem_.maxId,
          tCardProducts: tCardProducts_,
          tCardWastes: tCardWastes_,
          tCardMaterials: tCardMaterials_,
          tCardOperations: tCardOperations_,
          tCardStages: tCardStages_,
        });
        break;

      case 'DELETE':
        const id = Number(tcardId);
        await tCardProductRepository.delete({ tcard_id: id });
        // Удаляем все связанные данные: стадии, операции, продукты
        await tCardOperationsRepository.delete({ tcard_id: id });
        await tCardStagesRepository.delete({ tcard_id: id });
        // Теперь удаляем саму карту
        await tCardRepository.delete({ id: id });

        // Возвращаем успешный ответ
        res.status(200).json({ success: true, message: `TCard with id ${id} deleted successfully` });
        break;

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса:', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}


// получаю максимальный номер карты
// КАРТА
// получаю максимальный номер карты
async function generateNewNumberForCompany(tCardRepository: Repository<TCardTable>) {

  const result = await tCardRepository
    .createQueryBuilder("tCard")
    .select("MAX(CAST(tCard.number AS int))", "maxNumber")
    .getRawOne();

  // Если результат не null, возвращаем максимальное значение, иначе 
  const maxNumber = result?.maxNumber || 0;

  console.log(maxNumber);

  // Шаг 3: Генерируем новый номер
  const newNumber = maxNumber + 1;

  return newNumber;
}

// ТКАРТА
async function updateCard(tCardRepository: Repository<TCardTable>, tCard: TCardItem, userId: number, companyId: number, tCardMaxIdc: number) {
  let savedTCard = null;
  let error = "";

  // генерим пользовательский номер карты
  let newCardNumber = Number(tCard.number);
  if (tCard.number === 0) {
    newCardNumber = await generateNewNumberForCompany(tCardRepository);
    if (!newCardNumber) {
      error = `Ошибка при генерации номера карты`;
      console.log(error);
      return { success: false, message: error }
    }
  }

  // Если id карты положительный, то обновляем, если нет - создаем новую
  if (tCard.id && tCard.id > 0) {
    // Обновляем существующую карту
    savedTCard = await tCardRepository.save({
      ...tCard,  // сохраняем все поля карты, включая id
      user_id: Number(userId),
      company_id: Number(companyId),
      max_idc: tCardMaxIdc,
      coment: tCard.coment
    });
    console.log('Карта успешно обновлена с id:', savedTCard.id);
  } else {
    // Создаем новую карту
    const newTCard = tCardRepository.create({
      user_id: Number(userId),
      date: tCard.date,
      company_id: Number(companyId),
      number: newCardNumber,
      max_idc: tCardMaxIdc,
      coment: tCard.coment
    });

    savedTCard = await tCardRepository.save(newTCard);
    console.log('Новая карта успешно сохранена с id:', savedTCard.id);
  }

  // Проверка, что сохранение прошло успешно
  if (savedTCard && savedTCard.id) {
    console.log('Карта успешно сохранена или обновлена с id:', savedTCard.id);
  } else {
    error = `Ошибка при сохранении или обновлении карты ${JSON.stringify(tCard)}`;
    console.log(error);
    return { success: false, message: error }
  }

  return { success: true, savedTCard: savedTCard }

}

// СТАДИИ
async function updateStages(
  tCardStagesRepository: Repository<TCardStageTable>,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
  tCardStages: TCardStageItem[],
  savedTCard: TCardTable) {

  // СПИСОК СТАДИЙ  в базе
  const existingTCardStages = await tCardStagesRepository.find({ where: { tcard_id: savedTCard.id } });

  // 1. Найдём удалённые стадии
  const stagesToDelete = existingTCardStages.filter(stage =>
    !tCardStages.some(newStage => newStage.id === stage.id) // Сравниваем id существующих стадий с переданными
  );

  // 2. Найдём новые стадии, которых нет в базе
  const stagesToAdd = tCardStages.filter(stage =>
    !existingTCardStages.some(existingStage => existingStage.id === stage.id) // Сравниваем id переданных стадий с существующими
  );

  // 3. Найдём существующие стадии для обновления
  const stagesToUpdate = tCardStages.filter(stage =>
    existingTCardStages.some(existingStage => existingStage.id === stage.id) // Сравниваем id для существующих стадий
  );

  // Удаляем старые стадии
  if (stagesToDelete.length > 0) {
    // Для каждой стадии находим связанные с ней операции
    for (const stage of stagesToDelete) {
      // Получаем операции, связанные с текущей стадией
      const operationsToDelete = await tCardOperationsRepository.find({
        where: { stage_id: stage.id },
      });

      // Для каждой операции находим связанные с ней продукты
      for (const operation of operationsToDelete) {
        const productsToDelete = await tCardProductRepository
          .createQueryBuilder('product')
          .where('product.operation_id = :operationId', { operationId: operation.id })
          .getMany();

        // Удаляем продукты
        if (productsToDelete.length > 0) {
          await tCardProductRepository.remove(productsToDelete);
          console.log(`Удалено ${productsToDelete.length} продуктов для операции ${operation.id}`);
        }
      }

      // Удаляем операции
      if (operationsToDelete.length > 0) {
        await tCardOperationsRepository.remove(operationsToDelete);
        console.log(`Удалено ${operationsToDelete.length} операций для стадии ${stage.id}`);
      }
    }
    await tCardStagesRepository.remove(stagesToDelete);
  }

  // Добавляем новые стадии
  const newStages = stagesToAdd.map(stage => {
    return tCardStagesRepository.create({
      idc: stage.idc,
      code: stage.code,
      tcard_id: savedTCard.id,
    });
  });
  let savedNewStages = [] as TCardStageTable[]
  if (newStages.length > 0) savedNewStages = await tCardStagesRepository.save(newStages);
  if (!savedNewStages) return { success: false, message: "Не удалось сохранить стадии" }

  // Обновляем существующие стадии
  const updatedStages = stagesToUpdate.map(stage => {
    const existingStage = existingTCardStages.find(existingStage => existingStage.id === stage.id);
    if (existingStage) {
      existingStage.code = stage.code; // Обновляем нужные поля
      return tCardStagesRepository.create(existingStage);
    }
    return null;
  }).filter(stage => stage !== null);

  let savedUpdatedStages = [] as TCardStageTable[]
  if (updatedStages.length > 0) savedUpdatedStages = await tCardStagesRepository.save(updatedStages);
  if (!savedUpdatedStages) return { success: false, message: "Не удалось сохранить стадии" }

  // Все стадии сохранены, проверка
  const savedTCardStages = [...savedNewStages, ...savedUpdatedStages] as TCardStageTable[]

  if (tCardStages.length > 0) {
    // Проверка, что массив не пуст и все объекты имеют сгенерированный id
    let error = ""
    if (savedTCardStages.length > 0) {

      savedTCardStages.forEach((stage, index) => {
        if (stage.id) {
          console.log(`Стадия ${index + 1} успешно сохранена с id: ${stage.id}`);
        } else {
          error = `Ошибка при сохранении стадии ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить стадии`;
      console.log(error);
      return { success: false, message: error }
    }
  }
  return { success: true, savedTCardStages: savedTCardStages }
}

// ОПЕРАЦИИ
async function updateOperations(
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
  tCardOperations: TCardOperationItem[],
  savedTCard: TCardTable,
  savedTCardStages: TCardStageTable[] // Сохранённые стадии
) {

  // Получаем существующие операции для данного tCard
  const existingTCardOperations = await tCardOperationsRepository.find({
    where: { tcard_id: savedTCard.id },
  });

  // 1. Найдём удалённые операции
  const operationsToDelete = existingTCardOperations.filter(
    (operation) => !tCardOperations.some((newOperation) => newOperation.id === operation.id)
  );

  // 2. Найдём новые операции, которых нет в базе
  const operationsToAdd = tCardOperations.filter(
    (operation) => !existingTCardOperations.some((existingOperation) => existingOperation.id === operation.id)
  );

  // 3. Найдём существующие операции для обновления
  const operationsToUpdate = tCardOperations.filter(
    (operation) => existingTCardOperations.some((existingOperation) => existingOperation.id === operation.id)
  );


  // Удаляем старые операции
  // Перед этим надо удалить продукты, входящие в операцию
  const operationIds = operationsToDelete.map(op => op.id);

  // Если список операций пуст, пропускаем запрос
  if (operationIds.length > 0) {
    const productsToDelete = await tCardProductRepository
      .createQueryBuilder('product')
      .where('product.operation_id IN (:...operationIds)', { operationIds })
      .getMany();

    if (productsToDelete.length > 0) {
      // Удаляем продукты, связанные с этими операциями
      await tCardProductRepository.remove(productsToDelete);
      console.log(`Удалено ${productsToDelete.length} продуктов`);
    }
  }

  if (operationsToDelete.length > 0) {
    await tCardOperationsRepository.remove(operationsToDelete);
    console.log(`Удалено ${operationsToDelete.length} операций`);
  }

  let error = "";

  // Добавляем новые операции

  let newOperations = [];

  for (const operation of operationsToAdd) {
    const savedStage = savedTCardStages.find((stage) => stage.idc === operation.stage.idc);

    if (!savedStage) {
      error = `Ошибка при поиске стадии для операции С${operation.idc}`;
      console.log(error);
      break;  // Прерываем цикл
    }

    if (!operation.action.id) {
      error = `Ошибка, не заполнено действие в операции С${operation.idc}`;
      console.log(error);
      break;  // Прерываем цикл
    }
    newOperations.push(
      tCardOperationsRepository.create({
        idc: operation.idc,
        stage_id: savedStage.id,
        action_id: operation.action.id,
        action: operation.action,
        duration: operation.duration,
        tcard_id: savedTCard.id,
      }));
  }

  if (error) {
    return { success: false, message: error };
  }

  let savedNewOperations = [] as TCardOperationTable[];;
  if (newOperations.length > 0) {
    savedNewOperations = await tCardOperationsRepository.save(newOperations);
  }


  // Обновляем существующие операции
  let updatedOperations = [] as TCardOperationTable[];

  for (const operation of operationsToUpdate) {
    const existingOperation = existingTCardOperations.find(
      (existingOperation) => existingOperation.id === operation.id
    );

    if (!existingOperation) {
      error = `Операция с id ${operation.id} не найдена`;
      console.log(error);
      break;  // Прерываем цикл
    }

    const savedStage = savedTCardStages.find((stage) => stage.idc === operation.stage.idc);
    if (!savedStage || !savedStage.id) {
      error = `Ошибка при поиске стадии для операции С${operation.idc}`;
      console.log(error);
      break;  // Прерываем цикл
    }

    if (!operation.action.id) {
      error = `Ошибка, не заполнено действие в операции С${operation.idc}`;
      console.log(error);
      break;  // Прерываем цикл
    }

    // Обновляем нужные поля
    existingOperation.stage_id = savedStage.id;
    existingOperation.action_id = operation.action.id;
    //  existingOperation.action = operation.action; // не буду обновлять поскольку это пристегнутый клаччификатор
    existingOperation.duration = operation.duration;
    updatedOperations.push(existingOperation);
  }

  if (error) {
    return { success: false, message: error };
  }

  let savedUpdatedOperations = [] as TCardOperationTable[];
  if (updatedOperations.length > 0) {
    savedUpdatedOperations = await tCardOperationsRepository.save(updatedOperations); // сохраняем обновленные записи
  }

  // Все операции сохранены, проверка
  const savedTCardOperations = [...savedNewOperations, ...savedUpdatedOperations] as TCardOperationTable[];

  if (tCardOperations.length > 0) {
    let error = '';
    if (savedTCardOperations.length > 0) {
      savedTCardOperations.forEach((operation, index) => {
        if (operation.id) {
          console.log(`Операция ${index + 1} успешно сохранена с id: ${operation.id}`);
        } else {
          error = `Ошибка при сохранении операции ${index + 1}`;
          console.log(error);
          return { success: false, message: error };
        }
      });
    } else {
      error = `Не удалось сохранить операции`;
      console.log(error);
      return { success: false, message: error };
    }
  }
  return { success: true, savedTCardOperations: savedTCardOperations };
}

// ПРОДУКТЫ
// Расширяем тип TCardProductItem, чтобы добавить поле 'type' и operationId
interface TCardProductItemRecord extends TCardProductItem {
  type: TypeEnum;      // Добавляем поле 'type'
  operationId: number | null;  // Поле operationId
}

async function updateProducts(
  tCardProductRepository: Repository<TCardProductTable>,
  tCardProducts: TCardProductItem[],
  savedTCard: TCardTable,
  savedTCardOperations: TCardOperationTable[],
  tCardMaterials: TCardProductItem[],
  tCardWastes: TCardProductItem[],
  tCardOperations: TCardOperationItem[]
) {
  let error = "";
  let outArr = [] as TCardProductItemRecord[];
  let innArr = [] as TCardProductItemRecord[];



  // Преобразуем tCardOperations в объект, где idc операции - это ключ
  const operationsMap = savedTCardOperations.reduce((acc, operation) => {
    acc[operation.idc] = operation.idc;  // Сопоставляем idc операции с id
    return acc;
  }, {} as Record<number, number>);

  // Собираем продукты из операций и добавляем operationId на этом этапе
  tCardOperations.forEach(toper => {
    // Продукты на выходе (с добавлением operationId)
    outArr = [...outArr, ...toper.out.map((product) => ({ ...product, type: TypeEnum.O, operationId: operationsMap[toper.idc] }))];

    // Продукты на входе (с добавлением operationId)
    innArr = [...innArr, ...toper.inn.map((product) => ({ ...product, type: TypeEnum.I, operationId: operationsMap[toper.idc] }))];
  });

  // // Убираю ID Записей БД  синхронизация идет по idc
  // const tCardMaterials_ = tCardMaterials.map(({ id, ...rest }) => rest);   
  // const tCardWastes_ = tCardWastes.map(({ id, ...rest }) => rest);   
  // const innArr_ = innArr.map(({ id, ...rest }) => rest);   
  // const outArr_ = outArr.map(({ id, ...rest }) => rest);  

  // Собираем все продукты в один массив
  const tCardAllProducts = [
    ...tCardProducts.map((product) => ({ ...product, type: TypeEnum.P, operationId: null })),    // Для заказанных предметов type: TypeEnum.P
    ...tCardMaterials.map((product) => ({ ...product, type: TypeEnum.M, operationId: null })), // Для материалов type: TypeEnum.M
    ...tCardWastes.map((product) => ({ ...product, type: TypeEnum.W, operationId: null })),    // Для отходов type: TypeEnum.W
    ...outArr,
    ...innArr
  ] as TCardProductItemRecord[];


  // Шаг 1: Получаем существующие продукты из базы данных
  const existingTCardProducts = await tCardProductRepository.find({ where: { tcard_id: savedTCard.id } });

  // 1. Найдем удаленные продукты
  const productsToDelete = existingTCardProducts.filter(product =>
    !tCardAllProducts.some(newProduct => {
      return (
        newProduct.id === product.id
        && newProduct.codeS === product.code_s
        && newProduct.idc === product.idc
        && newProduct.type === product.type
        && newProduct.qtu === product.qtu
        && newProduct.uom.id === product.uom.id)
    }) // Сравниваем id существующих продуктов с переданными
  );

  // 2. Найдем новые продукты, которых нет в базе
  const productsToAdd = tCardAllProducts.filter(product =>
    !existingTCardProducts.some(existingProduct => {
      return (
        existingProduct.id === product.id
        && existingProduct.code_s === product.codeS
        && existingProduct.type === product.type
        && existingProduct.idc === product.idc
        && existingProduct.qtu === product.qtu
        && existingProduct.uom.id === product.uom.id)
    })
  );

  // 3. Найдем существующие продукты для обновления
  const productsToUpdate = tCardAllProducts.filter(product =>
    existingTCardProducts.some(existingProduct => {
      return (
        existingProduct.id === product.id
        && existingProduct.code_s === product.codeS
        && existingProduct.type === product.type
        && existingProduct.idc === product.idc
        && existingProduct.qtu === product.qtu
        && existingProduct.uom.id === product.uom.id)
    })
  );

  // Удаляем старые продукты
  if (productsToDelete.length > 0) await tCardProductRepository.remove(productsToDelete);


  // Добавляем новые продукты
  const newProducts = productsToAdd.map(product => {
    const opertab = savedTCardOperations.find(opertab => opertab.idc === product.operationId);
    return tCardProductRepository.create({
      idc: product.idc,
      code_s: product.codeS,
      type: product.type,
      title: product.title,
      qtu: product.qtu,
      uom_id: product.uom.id,
      operation: opertab ? opertab : null,
      operation_id: opertab ? opertab.id : null,
      tcard_id: savedTCard.id,
      uom: product.uom
    });
  });

  let savedNewProducts = [] as TCardProductTable[];
  if (newProducts.length > 0) {
    savedNewProducts = await tCardProductRepository.save(newProducts);
    if (!savedNewProducts) return { success: false, message: "Не удалось сохранить продукты" };
  }


  // Обновляем существующие продукты
  const updatedProducts = productsToUpdate.map(product => {
    const existingProduct = existingTCardProducts.find(existingProduct => existingProduct.id === product.id);
    if (existingProduct) {
      existingProduct.code_s = product.codeS; // Обновляем нужные поля
      existingProduct.title = product.title;
      existingProduct.qtu = product.qtu;
      existingProduct.uom_id = product.uom.id;
      existingProduct.operation_id = product.operationId;
      return tCardProductRepository.create(existingProduct);
    }
    return null;
  }).filter(product => product !== null);

  let savedUpdatedProducts = [] as TCardProductTable[];
  if (updatedProducts.length > 0) {
    savedUpdatedProducts = await tCardProductRepository.save(updatedProducts);
    if (!savedUpdatedProducts) return { success: false, message: "Не удалось сохранить продукты" };
  }

  // Все продукты сохранены, проверка
  const savedTCardProducts = [...savedNewProducts, ...savedUpdatedProducts] as TCardProductTable[];

  // если изначально был пустой массив продуктов уходим
  if (tCardAllProducts.length === 0) return { success: true, savedTCardProducts: savedTCardProducts };

  // если изначально был НЕ пустой массив продуктов  проверка
  if (savedTCardProducts.length > 0) {
    savedTCardProducts.forEach((product, index) => {
      if (product.id) {
        console.log(`Продукт ${index + 1} успешно сохранен с id: ${product.id}`);
      } else {
        error = `Ошибка при сохранении продукта ${index + 1}`;
        console.log(error);
        return { success: false, message: error };
      }
    });
  } else {
    error = `Не удалось сохранить продукты`;
    console.log(error);
    return { success: false, message: error };
  }

  return { success: true, savedTCardProducts: savedTCardProducts };
}
