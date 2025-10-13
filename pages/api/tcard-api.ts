//pages/api/tcard-api.ts
// API для получения, создания, обновления и удаления карт (TCard)
// Используется в создании/редактировании карт (TCardForm)
import { ulogger } from "./../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

// Это вариант АПИ по обработке карты оптимизированный того что без 1 в имени, потом надо остальное переделать
import { withAuth } from './../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../db/database';
import { getTypedRepository } from './../../db/utilites'
import { getLocaleFromHeader } from './../../lib/server/locale';

import { TCardTable } from './../../db/models/data/t_cards'
import { TCardStageTable } from './../../db/models/data/t_card_stages'
import { TCardOperationTable } from './../../db/models/data/t_card_operations'
import { TCardProductTable } from './../../db/models/data/t_card_products'
import { TeamScheduleTable } from './../../db/models/plan/team_schedule';
import { UnitActionTable } from './../../db/models/catalogs/unit_actions'
import { UnitLoadTable } from './../../db/models/plan/unit_loads'
import { ProductTable } from './../../db/models/data/products'

import { UnitTable } from './../../db/models/catalogs/units'
import { ActionTable } from './../../db/models/catalogs/actions'
import { getCurrentDateInString } from "./../../lib/common/timezone"

import {
  TCardItem, TCardProductItem, TCardOperationItem, TCardStageItem, StatusEnum,
  UnitItem, UnitLoadItem, UnitTypeEnum, UnitBelongEnum, ProductItem
} from './../../types/types';

import { getTeamShedule, getTCardFull, getTCardLoadsToCheckforDelete, getUnitActions, getUnits } from './../../handlers/handlers-get';  // 
import {
  updateCard, updateStages, updateOperations, updateCatalogProducts, updateProducts,
  updateTCardLoads, updateStatusTCard, updateStatusOperationByOperIds
} from './../../handlers/handlers-update';  // 

import { YYYYMMDD } from "@/lib/common/utils"

interface RequestBody {
  teamId: number, // универсально
  userId: number, // универсально
  tCard: TCardItem, // post
  tCardStages: TCardStageItem[], // post
  tCardId: number // del 
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();    
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

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); // locale = 'ru' | 'en'

    switch (req.method) {
      // получаем полную карту со всеми входящими и исходящими
      case 'GET':
        const { userId: userIdget, teamId: teamIdget, tCardId: tCardIdget } = req.query;

        const tCardGet = await getTCardFull(
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
        if (!tCardGet) {
          res.status(200).json({
            success: false,            
            message: `${t('mes.tCardNotFound')}`
          })
          break;
        }

        res.status(200).json({
          success: true,
          tCard: tCardGet,
        });
        break;
      // обновляем карту 
      case 'POST':

        const { teamId, userId, tCard, } = req.body as RequestBody;

        const resCard = await updateCard(Number(userId), locale, tCardRepository, tCard, Number(teamId))
        if (!resCard.success) {
          res.status(200).json({
            success: false,
            message: `${t('mes.error')} ${resCard.message}`
          })
          break;
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
            res.status(200).json({
              success: false,
              message: `${t('mes.error')} ${resCard.message}`
            })
            break;
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
            tCard.tCardStages,
            savedTCard,
            Number(teamId),
          )

          if (!resStages.success) {
            res.status(200).json({
              success: false,
              message: `${t('mes.error')} ${resCard.message}`
            })
            break;
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
            res.status(200).json({
              success: false,
              message: `${t('mes.error')} ${resCard.message}`
            })
            break;
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
            res.status(200).json({
              success: false,
              message: `${t('mes.error')} ${resCard.message}`
            })
            break;
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
          res.status(200).json({
            success: false,
            message: t("mes.tCardNotFound")
          });
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

        const shedule = await getTeamShedule(Number(userIddel), locale, Number(teamIddel), teamScheduleRepository)

        if (!shedule) {
          res.status(200).json({
            success: false,
            // message: "Ошибка, не найдено расписание команды",
            message: t('mes.sheduleNotFound'),
          });
          break;
        }

        // получаем полную карту со всеми входящими и исходящими
        const tCard_ = await getTCardFull(Number(userIddel), locale, Number(teamIddel), tCardId, tCardRepository, tCardOperationRepository, tCardProductRepository, tCardStageRepository, productRepository, actionRepository)

        if (!tCard_) {
          res.status(200).json({
            success: false,
            // message: "Карта с таким номером не найдена" });
            message: `${t('mes.tCardNotFound')}`
          })
          break;
        }
        // запросим действия юнитов
        const unitActions_ = await getUnitActions(Number(userIddel), locale, Number(teamIddel), unitActionsRepository)

        const units = await getUnits(Number(userIddel), locale, Number(teamIddel), unitRepository)

        const loads = await getTCardLoadsToCheckforDelete(Number(userIddel), locale, tCard_, units, unitLoadRepository)

        // фильтруем лоады по сегодняшней дате  в таймзоне команды
        const today = getCurrentDateInString(shedule.timeZone);

        // получаем исторические лоады и те которые еще не выполнены переводим в статус canceled
        const historyLoads = loads
          .filter(load => YYYYMMDD(load.date) < today)
          .map(load => {
            if (load.status === StatusEnum.planed) {
              return { ...load, status: StatusEnum.cancelled };
            }
            return load;
          });

        // получаем лоады которые в статусе уже сделанных и не в истории - они должны остаться
        // остальные удаляем
        const planLoads = loads.filter(load => {
          return YYYYMMDD(load.date) >= today &&
            (load.status === StatusEnum.performed || load.status === StatusEnum.defective || load.status === StatusEnum.ready);
        });

        const allLoads = [...historyLoads, ...planLoads];

        const resDel = await updateTCardLoads(Number(userIddel), locale, Number(teamIddel), tCardId, allLoads, unitLoadRepository);

        if (!resDel.success) {
          res.status(200).json({ success: false, message: resDel.message });
          break;
        }
        if (!resDel.loads) {
          res.status(200).json({ success: false, message: resDel.message });
          break;
        }

        // Переводим в тип UnitLoadItem[]                
        const loads_ = resDel.loads.map(lo => {
          const oper = tCard_.tCardOperations?.find(oper => oper.id === lo.id_oper);

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
            date: YYYYMMDD(lo.date),
            idc_oper: lo.idc_oper,
            id_oper: lo.id_oper,
            id_tCard: lo.id_tCard,
            timeStart: lo.timeStart, // здесь в минутах
            timeFinish: lo.timeFinish,
            status: lo.status,
            isActive: lo.isActive,
            isRetool: lo.isRetool,
            loadInfo: {
              tCardIdc: tCard_.idc,
              tCardDate: tCard_.date,
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

        //если есть лоады (Это те которые остались) то карту переводим в статус canceled вместе с операциями
        if (loads_.length > 0) {

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
              res.status(200).json({ success: false, message: resDel.message });
              break;
            }
          }

          const resCard = await updateStatusTCard(Number(userIddel), locale, tCardRepository, tCardId, StatusEnum.cancelled)
          if (!resCard.success) {
            res.status(200).json({
              success: false,
              message: resCard.message,
            });
            break;
          }

          // собираем все что осталось от карты
          const tCard_ = await getTCardFull(Number(userIddel), locale, Number(teamIddel), tCardId, tCardRepository, tCardOperationRepository, tCardProductRepository, tCardStageRepository, productRepository, actionRepository);

          res.status(200).json({
            success: true,
            tCard: tCard_,
            loads: loads_,
            message: `${t("mes.tCardCanceled")}`
          });
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
          
          res.status(200).json({
            success: true,
            loads: [] as UnitLoadItem[],
            // message: `TCard with id ${tCardId} deleted successfully`
            message: `${t("mes.tCardDeleted")}`
          });
          break;
        }

      default:
        res.status(405).json({ error: 'Method not supported.' });
    }

  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/tcard-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}


export default withAuth(handler)