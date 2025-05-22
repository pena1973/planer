// Это вариант АПИ по обработке карты оптимизированный того что без 1 в имени, потом надо остальное переделать
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/pages/db/database';  // Импортируем функцию подключения
import { Repository } from 'typeorm';

import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardStageTable } from '@/pages/db/models/data/t_card_stages'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { TeamTable } from '@/pages/db/models/catalogs/teams'

// import { TypeEnum } from '@/pages/db/models/enums';
import { TCardItem, TCardProductItem, TCardOperationItem, TCardStageItem, UOMItem, ActionItem } from '@/types';
import { getTCardFull, } from './handlers-get';  // 
import { updateCard, updateStages, updateOperations, updateProducts } from './handlers-update';  // 
import { t } from 'i18next';
import { TypeEnum } from '@/types';
// Определение перечисления

interface RequestBody {
  teamId: number,
  userId: number,
  tCard: TCardItem;
  tCardStages: TCardStageItem[];
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение
    const teamsRepository = dbConnection.getRepository(TeamTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationRepository = dbConnection.getRepository(TCardOperationTable);
    const tCardStageRepository = dbConnection.getRepository(TCardStageTable);
    const { tCardId: tCardIdget } = req.query;

    switch (req.method) {
      case 'GET':
        
        // получаем полную карту со всеми входящими и исходящими
        const tCard_ = await getTCardFull(
          Number(tCardIdget),
          tCardRepository,
          tCardOperationRepository,
          tCardProductRepository,
          tCardStageRepository
        )
        if (!tCard_) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          tCard: tCard_,
          messsage: ""
        });
        break;


      case 'POST':

        // Извлекаем данные из тела запроса
        const {
          teamId,
          userId,
          tCard,
        } = req.body as RequestBody;

        // КАРТА
        const resCard = await updateCard(tCardRepository, tCard, Number(userId), Number(teamId))

        if (!resCard.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resCard.message });
          return;
        }
        const savedTCard = resCard.savedTCard as TCardTable;

        // СПИСОК СТАДИЙ  
        let savedTCardStages = [] as TCardStageTable[];
        if (tCard.tCardStages && tCard.tCardStages.length > 0) {
          const resStages = await updateStages(
            tCardStageRepository,
            tCardOperationRepository,
            tCardProductRepository,
            tCard.tCardStages,
            savedTCard)
          if (!resStages.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resStages.message });
            return;
          }

          savedTCardStages = resStages.savedTCardStages as TCardStageTable[];
        }

        //СПИСОК ОПЕРАЦИЙ
        let savedTCardOperations = [] as TCardOperationTable[];
        if (tCard.tCardOperations && tCard.tCardOperations.length > 0) {
          const resOperations = await updateOperations(
            tCardOperationRepository,
            tCardProductRepository,
            tCard.tCardOperations,
            savedTCard,
            savedTCardStages)
          if (!resOperations.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOperations.message });
            return;
          }
          savedTCardOperations = resOperations.savedTCardOperations as TCardOperationTable[];
        }

        //СПИСОК ПРОДУКТОВ
        let savedTCardProducts = [] as TCardProductTable[];
        if ((tCard.tCardProducts && tCard.tCardProducts.length > 0)
          || (tCard.tCardMaterials && tCard.tCardMaterials.length > 0)
          || (tCard.tCardWastes && tCard.tCardWastes.length > 0)
          || (tCard.tCardOperations && tCard.tCardOperations.length > 0)
        ) {
          const resProducts = await updateProducts(
            tCardProductRepository,
            savedTCard,
            savedTCardOperations,
            (!tCard.tCardProducts) ? [] as TCardProductItem[] : tCard.tCardProducts,
            (!tCard.tCardMaterials) ? [] as TCardProductItem[] : tCard.tCardMaterials,
            (!tCard.tCardWastes) ? [] as TCardProductItem[] : tCard.tCardWastes,
            (!tCard.tCardOperations) ? [] as TCardOperationItem[] : tCard.tCardOperations,
          )

          if (!resProducts.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resProducts.message });
            return;
          }
          savedTCardProducts = resProducts.savedTCardProducts as TCardProductTable[];
        }


        // если дошли сюда значит при сохранении ничего не слетело 

        //  преобразуем  записи таблиц в наши типы но только с указанием  уже id базы
        const tCardStages_ = savedTCardStages
          .map(stage => { return { id: stage.id, idc: stage.idc, code: stage.code, mode: false }; });

        const tCardProducts_ = savedTCardProducts
          .filter(product => product.type === TypeEnum.P)
          .map(product => {
            return {
              id: product.id,
              idc: product.idc,
              code: product.code,  
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
              code: product.code,  
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
              code: product.code,
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
                  code: product.code,
                  title: product.title,
                  qtu: product.qtu,
                  uom: product.uom as UOMItem,  // Преобразуем UOMsTable в UOMItem
                } as TCardProductItem;
              });

            const out = savedTCardProducts
              .filter(product => { return (product.operation_id === oper.id && product.type === TypeEnum.O) })
              .map(product => {
                return {
                  id: product.id,
                  idc: product.idc,
                  code: product.code,
                  title: product.title,
                  qtu: product.qtu,
                  uom: product.uom as UOMItem,  // Преобразуем UOMsTable в UOMItem
                } as TCardProductItem;
              });

            return {
              id: oper.id,
              idc: oper.idc,
              order:oper.order,
              stage: stage,
              out: out,
              inn: inn,
              action: { id: oper.action.id, title: oper.action.title, code: oper.action.code } as ActionItem,
              duration: oper.duration, // в милисекундах   
              status: oper.status,
              coment:oper.coment,
              fixOperIdc:oper.fix_oper_idc,
            } as TCardOperationItem; // Приводим к типу TCardOperationItem
          });

        const tCardItem_ = {
          id: savedTCard.id,
          date: new Date(savedTCard.date).toLocaleDateString("en-CA"),
          idc: savedTCard.idc,
          modified: false, // Например, установка true, так как мы только что сохранили
          maxIdc: savedTCard.max_idc,
          coment: savedTCard.coment,
          status: savedTCard.status,
          tCardProducts: tCardProducts_,
          tCardWastes: tCardWastes_,
          tCardMaterials: tCardMaterials_,
          tCardOperations: tCardOperations_,
          tCardStages: tCardStages_,
        } as TCardItem; // Приводим к типу TCardItem


        // отправляем ответ
        res.status(200).json({
          success: true,
          tCard: tCardItem_,        
        });
        break;

      case 'DELETE':
        // Извлекаем данные из тела запроса
        
        const { tCardId: tCardIddel } = req.query;
        const id = Number(tCardIddel);
        await tCardProductRepository.delete({ tcard_id: id });
        // Удаляем все связанные данные: стадии, операции, продукты
        await tCardOperationRepository.delete({ tcard_id: id });
        await tCardStageRepository.delete({ tcard_id: id });
        // Теперь удаляем саму карту
        await tCardRepository.delete({ id: id });
        // Возвращаем успешный ответ
        res.status(200).json({ success: true, message: `TCard with id ${id} deleted successfully` });
        break;


      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (tcard-api1):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}


