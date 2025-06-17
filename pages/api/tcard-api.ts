// Это вариант АПИ по обработке карты оптимизированный того что без 1 в имени, потом надо остальное переделать
import { withAuth } from '@/lib/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/database';  // Импортируем функцию подключения

import { TCardTable } from '@/db/models/data/t_cards'
import { TCardStageTable } from '@/db/models/data/t_card_stages'
import { TCardOperationTable } from '@/db/models/data/t_card_operations'
import { TCardProductTable } from '@/db/models/data/t_card_products'
import { TeamTable } from '@/db/models/catalogs/teams'
import { UnitActionTable } from '@/db/models/catalogs/unit_actions'
import { UnitLoadTable } from '@/db/models/plan/unit_loads'

import {
  TCardItem, TCardProductItem,
  TCardOperationItem, TCardStageItem,
  UOMItem, ActionItem,
  StatusEnum, UnitItem,
  UnitLoadItem,
  UnitTypeEnum,
  UnitBelongEnum
} from '@/types/types';
import { getTCardFull, getTCardLoads, getUnitActions } from '@/handlers/handlers-get';  // 
import { updateCard, updateStages, updateOperations, 
  updateProducts, updateTCardLoads, updateStatusTCard, 
  updateStatusOperationByTCardId } from '@/handlers/handlers-update';  // 

import { TypeEnum } from '@/types/types';
// Определение перечисления

interface RequestBody {
  teamId: number,
  userId: number,
  tCard: TCardItem;
  tCardStages: TCardStageItem[];
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Убедимся, что подключение установлено    
    const dbConnection = await connectDb();  // Получаем подключение
    const teamsRepository = dbConnection.getRepository(TeamTable);
    const tCardRepository = dbConnection.getRepository(TCardTable);
    const tCardProductRepository = dbConnection.getRepository(TCardProductTable);
    const tCardOperationRepository = dbConnection.getRepository(TCardOperationTable);
    const tCardStageRepository = dbConnection.getRepository(TCardStageTable);
    const unitLoadRepository = dbConnection.getRepository(UnitLoadTable);
    const tCardOperationsRepository = dbConnection.getRepository(TCardOperationTable);
    const tCardStagesRepository = dbConnection.getRepository(TCardStageTable);
    const unitActionsRepository = dbConnection.getRepository(UnitActionTable);

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
              order: oper.order,
              stage: stage,
              out: out,
              inn: inn,
              action: { id: oper.action.id, title: oper.action.title, code: oper.action.code } as ActionItem,
              duration: oper.duration, // в милисекундах   
              status: oper.status,
              coment: oper.coment,
              fixOperIdc: oper.fix_oper_idc,
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

        const { tCardId: tCardIddel, teamId: teamIddel } = req.query;
        const tCardId = Number(tCardIddel);
        const teamId_ = Number(teamIddel);


        // получаем полную карту со всеми входящими и исходящими
        const tCard__ = await getTCardFull(tCardId, tCardRepository, tCardOperationsRepository, tCardProductRepository, tCardStagesRepository)
        // запросим действия юнитов
        const unitActions_ = await getUnitActions(teamId_, unitActionsRepository)

        if (!tCard__) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        const loads = await getTCardLoads(tCardId, unitLoadRepository)
        if (!loads) { res.status(200).json({ success: false, message: "Карта с таким id не найдена" }); }

        // фильтруем лоады по сегодняшней дате
        const today = new Date().toLocaleDateString("en-CA");

        // получаем исторические лоады и те которые еще не выполнены переводим в статус canceled
        const historyLoads = loads
          .filter(load => new Date(load.date).toLocaleDateString("en-CA") < today)
          .map(load => {
            if (load.status === StatusEnum.planed) {
              return { ...load, status: StatusEnum.cancelled }; // Возвращаем объект с новым статусом
            }
            return load;
          });

        // получаем лоады которые в статусе уже сделанных и не в истории - они должны остаться
        // остальные удаляем
        const planLoads = loads.filter(load => {
          return new Date(load.date).toLocaleDateString("en-CA") >= today &&
            (load.status === StatusEnum.performed || load.status === StatusEnum.defective || load.status === StatusEnum.ready);
        });

        const allLoads = [...historyLoads, ...planLoads];

        const resDel = await updateTCardLoads(teamId_, tCardId, allLoads, unitLoadRepository);
        if (!resDel.success) { res.status(200).json({ success: false, message: resDel.message }); }

        // Переводим в тип UnitLoadItem[]                
        const loads_ = resDel.loads.map(lo => {
          const oper = tCard__.tCardOperations?.find(oper => oper.id === lo.id_oper);

          const unit = lo.unit;
          const unitAction = unitActions_.find(ac => ac.unitId === unit.id && ac.action.id === oper?.action.id);;

          return {
            id: lo.id,
            idc: lo.idc,
            unit: {
              id: unit.id,
              idc: unit.idc,
              title: unit.title,
              code: unit.code,
              retool: unit.retool,
              modified: false,
              belong: unit.belong as UnitBelongEnum,
              type: unit.type as UnitTypeEnum,
              coment: unit.coment,
              active: unit.active,

            } as UnitItem,
            date: new Date(lo.date).toLocaleDateString('en-CA'),
            idc_oper: lo.idc_oper,
            id_oper: lo.id_oper,
            id_tCard: lo.id_tCard,
            timeStart: lo.timeStart, // здесь в минутах
            timeFinish: lo.timeFinish,
            status: lo.status,
            isActive: lo.isActive,
            isRetool: lo.isRetool,
            loadInfo: {
              tCardIdc: tCard__.idc,
              tCardDate: tCard__.date,
              title: oper?.action.title,
              duration: (!oper) ? 0 : oper.duration/1000,
              interruptible: oper?.action.interruptible,
              koef: unitAction?.koef ? unitAction.koef : 1,
            },
            isPinned: lo.isPinned,
            isOuterStart: lo.isOuterStart,
            isOuterFinish: lo.isOuterFinish,
            version: lo.version,
            isFirst: lo.isFirst
          } as UnitLoadItem
        })

        // если они есть удаляем текущие лоады, все что в стадии planed - переводим в canceled  
        // а саму карту  если остались лоады то канцел а если лоадов нет то удалим

        //если есть лоады (Это те которые остались) то карту переводим в статус canceled вместе с операциями
        if (loads_.length > 0) {

          // обновим статус операций
          const resOpers = await updateStatusOperationByTCardId(tCardOperationsRepository, tCardId, StatusEnum.cancelled)
          if (!resOpers.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOpers.message });
            break;
          }

          // обновим статус  карты
          const resCard = await updateStatusTCard(tCardRepository, tCardId, StatusEnum.cancelled)
          if (!resCard.success) {
            res.status(200).json({
              success: false,
              message: 'Статус карты не обновлен',
            });
            break;
          }
          // собираем все что осталось от карты
          const tCard_ = await getTCardFull(tCardId, tCardRepository, tCardOperationRepository, tCardProductRepository, tCardStageRepository);
          // Возвращаем успешный ответ
          res.status(200).json({ success: true, tCard: tCard_, loads: loads_, message: `TCard canceled successfully` });
          break
        } else {
          // лоадов нет удаляем карту и все связанные с ней данные
          await tCardProductRepository.delete({ tcard_id: tCardId });
          // Удаляем все связанные данные: стадии, операции, продукты
          await tCardOperationRepository.delete({ tcard_id: tCardId });
          await tCardStageRepository.delete({ tcard_id: tCardId });
          // Теперь удаляем саму карту
          await tCardRepository.delete({ id: tCardId });

          // Возвращаем успешный ответ
          res.status(200).json({ success: true, loads: [] as UnitLoadItem[], message: `TCard with id ${tCardId} deleted successfully` });
          break;
        }

      default:
        res.status(405).json({ error: 'Метод не поддерживается' }); // Метод не поддерживается
    }

  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (tcard-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}


export default withAuth(handler)