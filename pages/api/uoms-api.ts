import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения

import { UOMsTable } from '@/pages/db/models/catalogs/uoms';
import { Repository } from 'typeorm';
import { UOMItem } from '@/types';
import { getUOMs } from './handlers-get';  // расчеты

interface RequestBody {
  uoms: UOMItem[];
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение

    // Используем репозиторий для работы с сущностью TCardTable
    const uomsRepository = dbConnection.getRepository(UOMsTable);

    // userId, companyId в любом случае
    const { userId, companyId } = req.query;

    switch (req.method) {
      case 'GET':
        const uoms__ = await getUOMs(Number(companyId),uomsRepository)
      
        uoms__.sort((a, b) => {
          // Проверяем, что id определено
          if (a.id === undefined || b.id === undefined) {
            return 0; // Если id не определено, оставляем элементы на своих местах
          }
          return a.id - b.id; // Сортировка по id
        });

       // отправляем ответ
       res.status(200).json({
         success: true,
         uoms: uoms__,
       });

       break;
       case 'POST':
         // Извлекаем данные из тела запроса
               const { uoms } = req.body as RequestBody;
       
               // СПИСОК ДЕЙСТВИЙ 
               const resUOMS = await updateUOMS(
                 uomsRepository,
                 uoms,
                 Number(companyId)
               )
               if (!resUOMS.success) {
                 res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUOMS.message });
                 return;
               }
       
               const savedUOMs = resUOMS.savedUOMS as UOMsTable[];
       
               const uoms_ = savedUOMs
                 .map(uom => {
                   return {
                     id: uom.id,
                     title: uom.title,
                   };
                 });
       
               // отправляем ответ
               res.status(200).json({
                 success: true,
                 uoms: uoms_,
               });
               break;
      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (uoms-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}



// ДЕЙСТВИЯ
async function updateUOMS(
  uomsRepository: Repository<UOMsTable>,
  uoms: UOMItem[],
  company_id: number
) {

  // СПИСОК ДЕЙСТВИЙ в базе
  const existingUOMS = await uomsRepository.find({ where: { company_id: company_id } });

  // 1. Найдём удалённые единицы измерения
  const uomsToDelete = existingUOMS.filter(uom =>
    !uoms.some(newUOM => newUOM.id === uom.id) // Сравниваем id существующих стадий с переданными
  );

  // 2. Найдём новые единицы измерения, которых нет в базе
  const uomsToAdd = uoms.filter(uom =>
    !existingUOMS.some(existingUOMS => existingUOMS.id === uom.id) // Сравниваем id переданных стадий с существующими
  );

  // 3. Найдём существующие единицы измерения для обновления
  const uomsToUpdate = uoms.filter(uom =>
    existingUOMS.some(existingUOMS => existingUOMS.id === uom.id) // Сравниваем id для существующих стадий
  );

  // Удаляем старые единицы измерения
  if (uomsToDelete.length > 0) {
    await uomsRepository.remove(uomsToDelete);
  }

  // Добавляем новые единицы измерения
  const newUOMS = uomsToAdd.map(uom => {
    return uomsRepository.create({
      title: uom.title,
      company_id: company_id,
    });
  });
  let savedNewUOMS = [] as UOMsTable[]
  if (newUOMS.length > 0) savedNewUOMS = await uomsRepository.save(newUOMS);
  if (!savedNewUOMS) return { success: false, message: "Не удалось сохранить действие" }


  // Обновляем существующие единицы измерения
  const updatedUOMS = uomsToUpdate.map(uom => {
    const existingUOM = existingUOMS.find(existingUOM => existingUOM.id === uom.id);
    if (existingUOM) {
      existingUOM.title = uom.title; 
      return uomsRepository.create(existingUOM);
    }
    return null;
  }).filter(unitAction => unitAction !== null);

  let savedUpdatedUOMS = [] as UOMsTable[]
  if (updatedUOMS.length > 0) savedUpdatedUOMS = await uomsRepository.save(updatedUOMS);
  if (!savedUpdatedUOMS) return { success: false, message: "Не удалось сохранить единицы измерения " }

  // Все единицы измерения сохранены, проверка
  let error = ""
  const savedUOMS = [...savedNewUOMS, ...savedUpdatedUOMS] as UOMsTable[]

  // вход и выход массив единицы измерения не совпадает количество записей - чтото не сохранилось
  if (savedUOMS.length > 0 && uoms.length !== savedUOMS.length) {
    error = `Не удалось сохранить единицы измерения`;
    console.log(error);
    return { success: false, message: error }
  }

  // Проверка, что массив не пуст и все объекты имеют сгенерированный id
  if (savedUOMS.length > 0 && uoms.length > 0) {
    if (savedUOMS.length > 0) {

      savedUOMS.forEach((uom, index) => {
        if (uom.id) {
          console.log(`Единица измерения успешно сохранена с id: ${uom.id}`);
        } else {
          error = `Ошибка при сохранении единицы измерения ${index + 1}`;
          console.log(error);
          return { success: false, message: error }
        }
      });
    } else {
      error = `Не удалось сохранить единицы измерени`;
      console.log(error);
      return { success: false, message: error }
    }
  }
  return { success: true, savedUOMS: savedUOMS }
}