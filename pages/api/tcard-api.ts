// Это вариант АПИ по обработке карты оптимизированный того что без 1 в имени, потом надо остальное переделать
import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../db/utilites'
import { getLocaleFromHeader } from './../../lib/server/translate/locale';

import { TCardTable } from './../../db/models/data/t_cards'
import { TCardStageTable } from './../../db/models/data/t_card_stages'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'
import { TCardProductTable } from './../../db/models/data/t_card_products'
import { TeamTable } from './../../db/models/catalogs/teams'
import { TeamScheduleTable } from './../../db/models/plan/team_schedule';
import { UnitActionTable } from './../../db/models/catalogs/unit_actions'
import { UnitLoadTable } from './../../db/models/plan/unit_loads'
import { ProductTable } from './../../db/models/data/products'
import { UOMsTable } from './../../db/models/catalogs/uoms'
import { UnitTable } from './../../db/models/catalogs/units'
import { ActionTable } from './../../db/models/catalogs/actions'
import { getCurrentDateInString } from "./../../lib/common/timezone"

import {
  TCardItem, TCardProductItem,
  TCardOperationItem, TCardStageItem,
  StatusEnum, UnitItem,
  UnitLoadItem,
  UnitTypeEnum,
  UnitBelongEnum,
  ProductItem
} from './../../types/types';

import { getTeamShedule, getTCardFull, getTCardLoadsToCheckforDelete, getUnitActions, getUnits } from './../../handlers/handlers-get';  // 
import {
  updateCard, updateStages, updateOperations, updateCatalogProducts,
  updateProducts, updateTCardLoads, updateStatusTCard,
  updateStatusOperationByOperIds
} from './../../handlers/handlers-update';  // 

// Определение перечисления

interface RequestBody {
  teamId: number, // универсально
  userId: number, // универсально
  tCard: TCardItem, // post
  tCardStages: TCardStageItem[], // post
  tCardId: number // del 
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const tCardRepository = getTypedRepository(db, 'TCardTable', TCardTable);
  const tCardProductRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
  const tCardOperationRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
  const tCardStageRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
  const unitLoadRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
  const unitActionsRepository = getTypedRepository(db, 'UnitActionTable', UnitActionTable);
  const productRepository = getTypedRepository(db, 'ProductTable', ProductTable);
  const unitRepository = getTypedRepository(db, 'UnitTable', UnitTable);
  const actionRepository = getTypedRepository(db, 'ActionTable', ActionTable);
  const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
  try {
    const locale = getLocaleFromHeader(req.headers["x-lang"]);


    switch (req.method) {
      case 'GET':
        const { userId: userIdget, teamId: teamIdget, tCardId: tCardIdget } = req.query;
        // получаем полную карту со всеми входящими и исходящими
        const tCard_ = await getTCardFull(
          Number(userIdget),
          locale,
          Number(teamIdget),
          Number(tCardIdget),
          tCardRepository,
          tCardOperationRepository,
          tCardProductRepository,
          tCardStageRepository,
          productRepository,
          actionRepository
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
        const resCard = await updateCard(Number(userId), locale, tCardRepository, tCard, Number(teamId))

        if (!resCard.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + resCard.message });
          return;
        }
        const savedTCard = resCard.savedTCard as TCardItem;

        // КАТАЛОГ ПРОДУКТОВ  
        let savedProducts: ProductItem[] = [];
        if (tCard.products && tCard.products.length > 0) {
          const resProducts = await updateCatalogProducts(
            Number(userId),
            locale,
            productRepository,
            savedTCard,
            tCard.products ?? [] as ProductItem[],
            Number(teamId),
          )

          if (!resProducts.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resProducts.message });
            return;
          }
          savedProducts = resProducts.savedProducts as ProductItem[];
        }

        // СПИСОК СТАДИЙ  
        let savedTCardStages = [] as TCardStageItem[];
        if (tCard.tCardStages && tCard.tCardStages.length > 0) {
          const resStages = await updateStages(
            Number(userId),
            locale,
            tCardStageRepository,
            tCardOperationRepository,
            tCardProductRepository,
            tCard.tCardStages,
            savedTCard,
            Number(teamId),
          )
          if (!resStages.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resStages.message });
            return;
          }

          savedTCardStages = resStages.savedTCardStages as TCardStageItem[];
        }

        //СПИСОК ОПЕРАЦИЙ (без вложеных продуктов)
        let savedTCardOperations = [] as TCardOperationItem[];
        if (tCard.tCardOperations && tCard.tCardOperations.length > 0) {
          const resOperations = await updateOperations(
            Number(userId),
            locale,
            tCardOperationRepository,
            tCardProductRepository,
            tCard.tCardOperations,
            savedTCard,
            savedTCardStages,
            Number(teamId))
          if (!resOperations.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOperations.message });
            return;
          }
          savedTCardOperations = resOperations.savedTCardOperations as TCardOperationItem[];
        }

        //СПИСОК ПРОДУКТОВ
        let savedTCardProducts = [] as TCardProductItem[];
        if ((tCard.tCardProducts && tCard.tCardProducts.length > 0)
          || (tCard.tCardMaterials && tCard.tCardMaterials.length > 0)
          || (tCard.tCardWastes && tCard.tCardWastes.length > 0)
          || (tCard.tCardOperations && tCard.tCardOperations.length > 0)
        ) {
          const resProducts = await updateProducts(
            Number(userId),
            locale,
            savedProducts,
            tCardProductRepository,
            savedTCard,
            savedTCardOperations,
            (!tCard.tCardProducts) ? [] as TCardProductItem[] : tCard.tCardProducts,
            (!tCard.tCardMaterials) ? [] as TCardProductItem[] : tCard.tCardMaterials,
            (!tCard.tCardWastes) ? [] as TCardProductItem[] : tCard.tCardWastes,
            (!tCard.tCardOperations) ? [] as TCardOperationItem[] : tCard.tCardOperations,
            Number(teamId)
          )

          if (!resProducts.success) {
            res.status(500).json({ error: 'Не удалось обработать запрос. ' + resProducts.message });
            return;
          }
          savedTCardProducts = resProducts.savedTCardProducts as TCardProductItem[];
        }

        //  все записали а сейчас запросим полную карту
        // получаем полную карту со всеми входящими и исходящими
        const savedtCardItem = await getTCardFull(
          Number(userId),
          locale,
          Number(teamId),
          Number(savedTCard.id),
          tCardRepository,
          tCardOperationRepository,
          tCardProductRepository,
          tCardStageRepository,
          productRepository,
          actionRepository
        )
        if (!savedtCardItem) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        // Отправляем ответ с данными
        res.status(200).json({
          success: true,
          tCard: savedtCardItem,
          messsage: ""
        });


        break;

      case 'DELETE':

        // Извлекаем данные из тела запроса
        const { tCardId: tCardIddel, teamId: teamIddel, userId: userIddel } = req.body as RequestBody;
        const tCardId = Number(tCardIddel);

        const shedule_ = await getTeamShedule(Number(userIddel), locale, Number(teamIddel), teamScheduleRepository)

        if (!shedule_) {
          res.status(200).json({
            success: false,
            message: "Ошибка, не найдено расписание команды",
          });
          break;
        }

        // получаем полную карту со всеми входящими и исходящими
        const tCard__ = await getTCardFull(Number(userIddel), locale, Number(teamIddel), tCardId, tCardRepository, tCardOperationRepository, tCardProductRepository, tCardStageRepository, productRepository, actionRepository)
        // запросим действия юнитов
        const unitActions_ = await getUnitActions(Number(userIddel), locale, Number(teamIddel), unitActionsRepository)

        if (!tCard__) {
          res.status(200).json({ success: false, message: "Карта с таким номером не найдена" });
          return
        }

        const units = await getUnits(Number(userIddel), locale, Number(teamIddel), unitRepository)

        const loads = await getTCardLoadsToCheckforDelete(Number(userIddel), locale, tCard__, units, unitLoadRepository)
        // if (!loads) { res.status(200).json({ success: false, message: "Карта с таким id не найдена" }); }

        // фильтруем лоады по сегодняшней дате  в таймзоне команды
        // const today = new Date().toLocaleDateString("en-CA");
        const today = getCurrentDateInString(shedule_.timeZone);

        // получаем исторические лоады и те которые еще не выполнены переводим в статус canceled
        const historyLoads = loads
          // .filter(load => new Date(load.date).toLocaleDateString("en-CA") < today)
          .filter(load => load.date < today)
          .map(load => {
            if (load.status === StatusEnum.planed) {
              return { ...load, status: StatusEnum.cancelled }; // Возвращаем объект с новым статусом
            }
            return load;
          });

        // получаем лоады которые в статусе уже сделанных и не в истории - они должны остаться
        // остальные удаляем
        const planLoads = loads.filter(load => {
          // return new Date(load.date).toLocaleDateString("en-CA") >= today &&
          return load.date >= today &&
            (load.status === StatusEnum.performed || load.status === StatusEnum.defective || load.status === StatusEnum.ready);
        });

        const allLoads = [...historyLoads, ...planLoads];

        // !!!!Проверить
        const resDel = await updateTCardLoads(Number(userIddel), locale, Number(teamIddel), tCardId, allLoads, unitLoadRepository);
        if (!resDel.success) { res.status(200).json({ success: false, message: resDel.message }); }

        // Переводим в тип UnitLoadItem[]                
        const loads_ = resDel.loads.map(lo => {
          const oper = tCard__.tCardOperations?.find(oper => oper.id === lo.id_oper);


          const unit = units.find(u => u.id = lo.unit_id);
          if (!unit) return null;
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
            date: lo.date,
            // date: new Date(lo.date).toLocaleDateString('en-CA'),
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
              duration: (!oper) ? 0 : oper.duration / 1000,
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
          // Здесь надо отменить только операции в статусе планед которые не были выполнены  
          // обновим статус операций не делаем  операции были уже выполнены хотя карта отменена
          // const resOpers = await updateStatusOperationByTCardId(tCardOperationRepository, tCardId, StatusEnum.cancelled)
          // if (!resOpers.success) {
          //   res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOpers.message });
          //   break;
          // }

          // Здесь надо отменить только операции в статусе планед которые не были выполнены  
          const operIds = [...new Set(
            loads
              .filter(l => [StatusEnum.planed, StatusEnum.cancelled].includes(l.status)) // только план/отмена
              .map(l => l.id_oper)                                                       // берём id_oper
          )]
            .filter(operId =>
              loads
                .filter(l => l.id_oper === operId)
                .every(l => [StatusEnum.planed, StatusEnum.cancelled].includes(l.status))  // нет других статусов
            );
          if (operIds.length > 0) {
            const resOpers = await updateStatusOperationByOperIds(Number(userIddel), locale, tCardOperationRepository, operIds, StatusEnum.cancelled)
            if (!resOpers.success) {
              res.status(500).json({ error: 'Не удалось обработать запрос. ' + resOpers.message });
              break;
            }
          }

          // обновим статус  карты
          const resCard = await updateStatusTCard(Number(userIddel), locale, tCardRepository, tCardId, StatusEnum.cancelled)
          if (!resCard.success) {
            res.status(200).json({
              success: false,
              message: 'Статус карты не обновлен',
            });
            break;
          }

          // собираем все что осталось от карты
          const tCard_ = await getTCardFull(Number(userIddel), locale, Number(teamIddel), tCardId, tCardRepository, tCardOperationRepository, tCardProductRepository, tCardStageRepository, productRepository, actionRepository);
          // Возвращаем успешный ответ
          res.status(200).json({ success: true, tCard: tCard_, loads: loads_, message: `TCard canceled successfully` });
          break
        } else {

          // лоадов нет удаляем карту и все связанные с ней данные
          await tCardProductRepository.delete({ tcard_id: tCardId });
          // Удаляем все связанные данные: стадии, операции, продукты
          await tCardOperationRepository.delete({ tcard_id: tCardId });
          await tCardStageRepository.delete({ tcard_id: tCardId });
          await productRepository.delete({ tcard_id: tCardId });
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