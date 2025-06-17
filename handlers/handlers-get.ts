
import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual, FindManyOptions, FindOptionsWhere } from 'typeorm';

// tables
import { UnitTable } from '@/db/models/catalogs/units'
import { UnitActionTable } from '@/db/models/catalogs/unit_actions'
import { UnitLoadTable } from '@/db/models/plan/unit_loads';
import { TCardTable } from '@/db/models/data/t_cards'
import { TCardProductTable } from '@/db/models/data/t_card_products'
import { TCardOperationTable } from '@/db/models/data/t_card_operations'
import { TCardStageTable } from '@/db/models/data/t_card_stages'

import { SupportMessageItem, TypeEnum } from '@/types/types';
import { ActionTable } from '@/db/models/catalogs/actions';
import { UOMsTable } from '@/db/models/catalogs/uoms';
import { UnitExceptionTable } from '@/db/models/plan/unit_exceptions';
import { TeamScheduleTable } from '@/db/models/plan/team_schedule';
import { SettingsTable } from '@/db/models/plan/settings';

import { UserTable } from '@/db/models/catalogs/users';
import { UserUnitTable } from '@/db/models/catalogs/user_unit';
import { BillTable } from '@/db/models/support/bills';
import { SupportTable } from '@/db/models/support/support';


// types
import { StatusEnum, UserItem, UnitItem, UnitLoadItem, UnitActionItem, UnitBelongEnum, UnitTypeEnum, UnitExceptionItem, TimeTypeEnum, DaysOfWeek, TimeZoneEnum, TCardOperationTermsItem } from '@/types/types';
import { TCardItem, TCardOperationItem, TCardProductItem, UserUnitItem, TCardStageItem, ActionItem, UOMItem, ScheduleItem, SettingsItem, TCardTermsItem, BillItem } from '@/types/types';

// единицы измерения
export async function getUOMs(
  teamId: number,
  uomsRepository: Repository<UOMsTable>
): Promise<UOMItem[]> {

  // Строим фильтр для поиска

  const filter: { team_id?: number; } = {};

  if (teamId) {
    filter.team_id = teamId;
  }

  // Выполняем запрос с фильтрацией
  const receivedUOMS = await uomsRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });
  // console.log(receivedUOMS);

  const uoms__ = receivedUOMS
    .map(uom => {
      return {
        id: uom.id,
        code: uom.code,
        title: uom.title,
      };
    });

  return uoms__;
}
// возможные операции команды
export async function getActions(
  teamId: number,
  actionsRepository: Repository<ActionTable>
): Promise<ActionItem[]> {
  // Строим фильтр для поиска

  const filter: Partial<ActionTable> = {};
  if (teamId) {
    filter.team_id = teamId;
  }

  // Выполняем запрос с фильтрацией
  const receivedActions = await actionsRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });
  // console.log(receivedActions);

  const actions__ = receivedActions
    .map(action => {
      return {
        id: action.id,
        code: action.code,
        title: action.title,
        interruptible: action.interruptible
      } as ActionItem;
    });


  return actions__;
}
// юниты
export async function getUnits(
  teamId: number,
  unitRepository: Repository<UnitTable>,
  // unitActionsRepository: Repository<UnitActionTable>
): Promise<UnitItem[]> {
  // Строим фильтр для поиска
  const filter: Partial<UnitActionTable> = {};
  if (teamId) {
    filter.team_id = teamId;
  }

  // Выполняем запрос с фильтрацией
  const receivedUnits = await unitRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });

  // if (!receivedUnits) return [] as UnitItem[]

  // const unitIds = receivedUnits.map(unit => unit.id);

  // const filter1: any = {};
  // if (unitIds.length > 0) {
  //   filter1.unit_id = In(unitIds);  // Используем In() для фильтрации по массиву ID
  // }

  // // Выполняем запрос с фильтрацией
  // const receivedActionsUnit = await unitActionsRepository.find({
  //   where: filter1,  // Применяем фильтр к запросу
  // });

  // console.log(receivedUnits);

  const units = receivedUnits
    .map(unit => {

      // const actions: UnitActionItem[] = receivedActionsUnit
      //   .filter(unitAction => unitAction.unit_id === unit.id)
      //   .map(unitAction => {
      //     return ({
      //       id: unitAction.id,
      //       action: unitAction.action,
      //       koef: unitAction.koef
      //     })
      //   })

      return {
        id: unit.id,
        idc: unit.idc,
        title: unit.title,
        code: unit.code,
        // actions: actions,
        retool: unit.retool,
        modified: false,
        belong: unit.belong as UnitBelongEnum,
        type: unit.type as UnitTypeEnum,
        coment: unit.coment,
        active: unit.active
      };
    });

  return units;
}

// необходимо потом получить операции покартам и дополнить даннве info

// загрузка юнитов 
export async function getUnitLoads(
  units: UnitItem[],
  unitLoadRepository: Repository<UnitLoadTable>,

): Promise<UnitLoadItem[]> {

  const unitIds = units.map(unit => unit.id); // Получаем массив идентификаторов

  if (unitIds.length === 0) {
    // Если нет юнитов, можно вернуть пустой результат или обработать ошибку
    return [];
  }

  const unitLoads = await unitLoadRepository.createQueryBuilder('unitLoad')
    .andWhere('unitLoad.unit_id IN (:...unitIds)', { unitIds }) // Фильтруем по unitIds
    .leftJoinAndSelect('unitLoad.tCard', 'tCard') // Добавляем связь с таблицей tCard
    .getMany();

  const unitLoadItems: UnitLoadItem[] = unitLoads.map(unitLoad => {

    const unit = units.find(unit => unit.id === unitLoad.unit_id)

    return {
      id: unitLoad.id,
      idc: unitLoad.idc,  // добавлено
      unit: unit ? unit : {} as UnitItem, // гарантированно существует
      date: String(unitLoad.date),
      id_oper: unitLoad.id_oper,
      idc_oper: unitLoad.idc_oper,
      id_tCard: unitLoad.id_tCard,
      timeStart: unitLoad.timeStart,
      timeFinish: unitLoad.timeFinish,
      status: unitLoad.status,
      version: unitLoad.version,
      isActive: unitLoad.isActive,
      isRetool: unitLoad.isRetool,
      isPinned: unitLoad.isPinned,
      isOuterFinish: unitLoad.isOuterFinish,
      isOuterStart: unitLoad.isOuterStart,
      isFirst: unitLoad.isFirst,
      // частично заполняем инфо по карте
      loadInfo: {
        tCardIdc: unitLoad.tCard.idc,
        tCardDate: new Date(unitLoad.tCard.date).toLocaleDateString("en-CA"),
        title: "",
        duration: 0,
        interruptible: false,
        koef: 1
      },
    };
  });
  return unitLoadItems;
}

// id лоадов по операции с определенной версией
export async function getTCardOperationLoads(
  tCardId: number, // ID карты для фильтрации
  operId: number, // ID операции для фильтрации
  version: number, // Версия для фильтрации
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<number[]> {


  // Получаем операции с фильтрацией по tCardId, operId и version
  const unitLoads = await unitLoadRepository.createQueryBuilder('unitLoad')
    .where('unitLoad.id_tCard = :tCardId', { tCardId })
    .andWhere('unitLoad.id_oper = :operId', { operId })
    .andWhere('unitLoad.version = :version', { version })
    .getMany();

  const loadsIds = unitLoads.map(lo => lo.id)
  return loadsIds;
}
// ВСЕ лоады по КАРТЕ (ДЛЯ ПРОВЕРКИ удаления карты)
export async function getTCardLoads(
  tCardId: number, // ID карты для фильтрации
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<UnitLoadItem[]> {

  // Получаем операции с фильтрацией по tCardId

  const unitLoads = await unitLoadRepository.createQueryBuilder('unitLoad')
    .leftJoinAndSelect('unitLoad.unit', 'unit') // Добавляем связь с таблицей units
    .where('unitLoad.id_tCard = :tCardId', { tCardId })
    .getMany();

  const loads = unitLoads.map(unitLoad => {
    return {
      id: unitLoad.id,
      idc: unitLoad.idc,  // добавлено
      unit: unitLoad.unit ? unitLoad.unit : {} as UnitItem, // гарантированно существует
      date: String(unitLoad.date),
      id_oper: unitLoad.id_oper,
      idc_oper: unitLoad.idc_oper,
      id_tCard: unitLoad.id_tCard,
      timeStart: unitLoad.timeStart,
      timeFinish: unitLoad.timeFinish,
      status: unitLoad.status,
      version: unitLoad.version,
      isActive: unitLoad.isActive,
      isRetool: unitLoad.isRetool,
      isPinned: unitLoad.isPinned,
      isOuterFinish: unitLoad.isOuterFinish,
      isOuterStart: unitLoad.isOuterStart,
      isFirst: unitLoad.isFirst
    } as UnitLoadItem
  });

  return loads;
}
// список карт только шапка
export async function getTCards(
  teamId: number,
  statuses: StatusEnum[],  // все кроме этих, что в списке
  tCardRepository: Repository<TCardTable>
): Promise<TCardItem[]> {


  // Строим фильтр для поиска
  const filter: FindOptionsWhere<TCardTable> = {};

  if (teamId) {
    filter.team_id = teamId;
  }

  if (statuses && statuses.length > 0) {
    filter.status = In(statuses);
  }

  // // Строим фильтр для поиска
  // const filter: any = {};
  // if (teamId) {
  //   filter.team_id = teamId;  // Фильтрация по team_id
  // }


  if (statuses && statuses.length > 0) {
    // статус **не** в списке statuses
    filter.status = In(statuses);
  }

  // Выполняем запрос с фильтрацией
  const tCards = await tCardRepository.find({
    where: filter,  // Применяем фильтр к запросу
    // Указываем, какие поля нужно вернуть
    select: ['id', 'date', 'idc', 'coment', 'status', 'max_idc'],
  });

  // Проверяем, что карта существует
  if (!tCards) return [] as TCardItem[];

  // Преобразуем результат в TCardItem[]
  const tCards_ = tCards.map(tCardtab => {
    return {
      id: tCardtab.id,
      date: new Date(tCardtab.date).toLocaleDateString("en-CA"),
      idc: tCardtab.idc || 1,  // Если number не заполнен, возвращаем "1"
      modified: false,
      maxIdc: tCardtab.max_idc,
      coment: tCardtab.coment,
      status: tCardtab.status
    } as TCardItem
  })

  return tCards_;
}

// КАРТА! только шапка
export async function getTCard(
  tcardId: number,
  tCardRepository: Repository<TCardTable>
): Promise<TCardItem | undefined> {
  // Строим фильтр для поиска по id карты
  const filter: Partial<TCardTable> = {};

  if (tcardId) {
    filter.id = tcardId;
  }

  // Получаем карту по id
  const tCardtab = await tCardRepository.findOne({
    where: filter,  // Применяем фильтр к запросу
    relations: ['team', 'user'],  // Указываем связанные таблицы (если необходимо)
  });

  // Проверяем, что карта существует
  if (!tCardtab) return undefined;

  // Преобразуем карты    
  return {
    id: tCardtab.id,
    date: new Date(tCardtab.date).toLocaleDateString("en-CA"),
    idc: tCardtab.idc || 1,  // Если number не заполнен, возвращаем "1"
    modified: true,  // Например, помечаем, что карта изменена
    maxIdc: tCardtab.max_idc,
    coment: tCardtab.coment,
    status: tCardtab.status
  };

}
// КАРТА! Вместе с составными частями карты
export async function getTCardFull(
  tcardId: number,
  tCardRepository: Repository<TCardTable>,
  tCardOperationRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
  tCardStageRepository: Repository<TCardStageTable>
): Promise<TCardItem | undefined> {

  // Строим фильтр для поиска по id карты
  const filter: { id?: number; } = {};
  if (tcardId) {
    filter.id = tcardId;
  }

  // Получаем карту по id
  const tCardtab = await tCardRepository.findOne({
    where: filter,  // Применяем фильтр к запросу
    relations: ['team', 'user'],  // Указываем связанные таблицы
  });

  // Проверяем, что карта существует
  if (!tCardtab) return undefined;

  // СТАДИИ
  const tCardStagestab = await tCardStageRepository.find({ where: { tcard_id: tcardId } });


  // Преобразуем стадии
  const tCardStages_ = tCardStagestab
    .map(stage => {
      return {
        id: stage.id,
        idc: stage.idc,
        code: stage.code,
      } as TCardStageItem;
    });


  // ПРОДУКТЫ, МАТЕРИАЛЫ, ОТХОДЫ
  const tCardProductstab = await tCardProductRepository.find({ where: { tcard_id: tcardId } });

  // Преобразуем материалы
  const tCardMaterials_ = tCardProductstab
    .filter(product => product.type === TypeEnum.M)
    .map(product => {
      return {
        id: product.id,
        idc: product.idc,
        code: product.code,
        title: product.title,
        qtu: product.qtu,
        uom: {
          id: product.uom.id,
          title: product.uom.title,
          code: product.uom.code,
        } as UOMItem
      } as TCardProductItem;
    });
  // Преобразуем продукты
  const tCardProducts_ = tCardProductstab
    .filter(product => product.type === TypeEnum.P)
    .map(product => {
      return {
        id: product.id,
        idc: product.idc,
        code: product.code,
        title: product.title,
        qtu: product.qtu,
        uom: {
          id: product.uom.id,
          title: product.uom.title,
          code: product.uom.code,
        } as UOMItem
      } as TCardProductItem;
    });
  // Преобразуем отходы
  const tCardWastes_ = tCardProductstab
    .filter(product => product.type === TypeEnum.W)
    .map(product => {
      return {
        id: product.id,
        idc: product.idc,
        code: product.code,
        title: product.title,
        qtu: product.qtu,
        uom: {
          id: product.uom.id,
          title: product.uom.title,
          code: product.uom.code,
        } as UOMItem
      } as TCardProductItem;
    });

  // ОПЕРАЦИИ
  const tCardOperationstab = await tCardOperationRepository.find({ where: { tcard_id: tcardId } });
  // Преобразуем операции
  const tCardOperations_ = tCardOperationstab
    .map(oper => {
      const inn = tCardProductstab
        .filter(product => { return (product.operation_id === oper.id && product.type === TypeEnum.I) })
        .map(product => {
          return {
            id: product.id,
            idc: product.idc,
            code: product.code,
            title: product.title,
            qtu: product.qtu,
            uom: {
              id: product.uom.id,
              title: product.uom.title,
              code: product.uom.code,
            } as UOMItem
          } as TCardProductItem;
        });

      const out = tCardProductstab
        .filter(product => { return (product.operation_id === oper.id && product.type === TypeEnum.O) })
        .map(product => {
          return {
            id: product.id,
            idc: product.idc,
            code: product.code,
            title: product.title,
            qtu: product.qtu,
            uom: {
              id: product.uom.id,
              title: product.uom.title,
              code: product.uom.code,
            } as UOMItem
          } as TCardProductItem;
        });

      return {
        id: oper.id,
        idc: oper.idc,
        stage: { id: oper.stage.id, idc: oper.stage.idc, code: oper.stage.code, } as TCardStageItem,
        out: out,
        inn: inn,
        action: { id: oper.action.id, title: oper.action.title, interruptible: oper.action.interruptible, code: oper.action.code } as ActionItem,
        duration: oper.duration, // в милисекундах   
        status: oper.status,
        coment: oper.coment,
        fixOperIdc: oper.fix_oper_idc,
      };
    });

  const tCard = {
    id: tCardtab.id,
    date: new Date(tCardtab.date).toLocaleDateString("en-CA"),
    idc: tCardtab.idc,
    tCardProducts: tCardProducts_,
    tCardWastes: tCardWastes_,
    tCardOperations: tCardOperations_,
    tCardMaterials: tCardMaterials_,
    tCardStages: tCardStages_,
    maxIdc: tCardtab.max_idc,
    coment: tCardtab.coment,
    status: tCardtab.status,
    modified: false,

  } as TCardItem

  return tCard
}
// запрос для отчета о состоянии готовности карты + операции + лоады
export async function getTCardsTerms(
  teamId: number,
  tCardIdc: number | undefined,
  tCardDateFrom: string | undefined,
  tCardDateTo: string | undefined,
  tCardStatus: StatusEnum | undefined,
  tCardRepository: Repository<TCardTable>,
  tCardOperationRepository: Repository<TCardOperationTable>,
  // tCardProductRepository: Repository<TCardProductTable>,
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<{ terms: TCardTermsItem[], loads: UnitLoadItem[] }> {

  
    const where: FindOptionsWhere<TCardTable> = {
    team_id: teamId,
  };

  if (tCardIdc) {
    where.idc = tCardIdc;
  }

  const dateFrom = tCardDateFrom ? new Date(tCardDateFrom) : undefined;
  const dateTo = tCardDateTo ? new Date(tCardDateTo) : undefined;
  if (dateFrom) dateFrom.setHours(0, 0, 0, 0);
  if (dateTo) dateTo.setHours(23, 59, 59, 999);

  if (dateFrom && dateTo) {
    where.date = Between(dateFrom, dateTo);
  } else if (dateFrom) {
    where.date = MoreThanOrEqual(dateFrom);
  } else if (dateTo) {
    where.date = LessThanOrEqual(dateTo);
  }

  if (tCardStatus) {
    where.status = tCardStatus;
  }

  // Создаем объект фильтра для карты
  const tCardFilter: FindManyOptions<TCardTable> = {
  where,
  relations: ['team', 'user'],
};

  // Получаем все карты для заданной компании с фильтрацией
  const tCards = await tCardRepository.find(tCardFilter);


  const tCardTerms: TCardTermsItem[] = []; // массив на выход

  // Загружаем операции для всех карт
  const tCardsIds = tCards.map(card => card.id);
  const operationsData = await tCardOperationRepository.find({
    where: { tcard_id: In(tCardsIds) },
    relations: ['stage', 'action']
  });


  // Загружаем лоады для всех операций
  const operationsIds = operationsData.map(oper => oper.id);

  const loadsData = await unitLoadRepository.find({
    where: { id_oper: In(operationsIds) },
    relations: ['unit', 'tCard']
  });

  // лоады
  const loads = loadsData.map(lo => {
    return {
      id: lo.id,
      idc: lo.idc,
      unit: lo.unit as UnitItem,
      date: new Date(lo.date).toLocaleDateString('en-CA'),
      idc_oper: lo.idc_oper,
      id_oper: lo.id_oper,
      id_tCard: lo.id_tCard,
      timeStart: lo.timeStart, // здесь в минутах
      timeFinish: lo.timeFinish,
      status: lo.status,
      isActive: lo.isActive,
      isRetool: lo.isRetool,
      isPinned: lo.isPinned,
      isOuterStart: lo.isOuterStart,
      isOuterFinish: lo.isOuterFinish,
      version: lo.version,
      isFirst: lo.isFirst,
      // частично заполняем инфо по карте
      loadInfo: {
        tCardIdc: lo.tCard.idc,
        tCardDate: new Date(lo.tCard.date).toLocaleDateString("en-CA"),
        title: "",
        duration: 0,
        interruptible: false,
        koef: 1
      },

    }
  })

  // функции вычисления сроков 
  interface ReadyTerm {
    date: string; // Формат: "YYYY-MM-DD"
    time: number; // Время в минутах от начала дня
  }
  function getLatestFinish(loads: UnitLoadTable[]): ReadyTerm {
    if (loads.length === 0) return { date: "", time: 0 };
    const latestLoad = loads.reduce((latest, current) => {
      // Сначала сравниваем дату (так как формат "YYYY-MM-DD" корректно сравнивается как строки)
      if (current.date > latest.date) {
        return current;
      } else if (current.date === latest.date && current.timeFinish > latest.timeFinish) {
        return current;
      }
      return latest;
    }, loads[0]);
    return { date: String(latestLoad.date), time: latestLoad.timeFinish };
  }
  function getLaterDateTime(dt1: ReadyTerm, dt2: ReadyTerm): ReadyTerm {
    // Сначала сравниваем даты (формат "YYYY-MM-DD" корректно сравнивается как строка)
    if (dt1.date > dt2.date) {
      return dt1;
    } else if (dt1.date < dt2.date) {
      return dt2;
    } else {
      // Если даты совпадают, сравниваем время (в минутах от начала дня)
      return Number(dt1.time) >= Number(dt2.time) ? dt1 : dt2;
    }
  }

  // выбираем операции по картам и формируем ответ Item
  for (const card of tCards) {
    // Срок готовности карты
    let cardTerm = {
      date: '0001-01-01',
      time: 0
    } as ReadyTerm

    const cardOperationsData = operationsData.filter(oper => oper.tcard_id === card.id);
    const tCardOperations = [] as TCardOperationTermsItem[];
    // формируем массив операций по карте
    for (const oper of cardOperationsData) {
      // Отбираем все загрузки для данной операции
      const loadsForOper = loadsData.filter(load => load.id_oper === oper.id && !load.isRetool);
      // Находим загрузку с максимально поздним временем завершения - это дата исполнения операции
      const latestTerm: ReadyTerm = getLatestFinish(loadsForOper);

      // обновляем срок готовности карты
      cardTerm = getLaterDateTime(cardTerm, latestTerm);

      tCardOperations.push({
        id: oper.id,
        idc: oper.idc,
        stage: oper.stage,
        order: oper.order,
        out: [] as TCardProductItem[],
        inn: [] as TCardProductItem[],
        action: oper.action as ActionItem,
        duration: oper.duration,
        mode: false,
        status: oper.status,
        coment: oper.coment,
        readyTerm: latestTerm,
        expand: false,
        fixOperIdc: oper.fix_oper_idc,
      } as TCardOperationTermsItem);
    }


    tCardTerms.push({
      id: card.id,
      date: new Date(card.date).toLocaleDateString("en-CA"),
      idc: card.idc,
      modified: false,
      tCardOperations: tCardOperations as TCardOperationTermsItem[],
      maxIdc: card.max_idc,
      coment: card.coment,
      status: card.status,
      readyTerm: cardTerm,
      expand: false,


    } as TCardTermsItem)
  }

  return { terms: tCardTerms, loads: loads };
}
// исключения расписания команды
export async function getExceptions(
  teamId: number,
  unitExceptionsRepository: Repository<UnitExceptionTable>): Promise<UnitExceptionItem[]> {
  // Строим фильтр для поиска
  const filter: Partial<UnitExceptionTable> = {};
  if (teamId) {
    filter.team_id = teamId;
  }

  const receivedExceptions = await unitExceptionsRepository.find({
    where: filter,  // Применяем фильтр к запросу
    // relations: ['unit'], // Добавляем связь с таблицей Unit
  });

  if (!receivedExceptions) return [] as UnitExceptionItem[]

  const excertions = receivedExceptions
    .map(exception => {

      return {
        id: exception.id,
        unitId: exception.unit_id,
        date: String(exception.date),
        type: exception.type as TimeTypeEnum,
        timeStart: exception.timeStart,
        timeFinish: exception.timeFinish,

      } as UnitExceptionItem;
    });

  return excertions;
}
// возможные операции юнита
export async function getUnitActions(
  teamId: number,
  unitActionsRepository: Repository<UnitActionTable>): Promise<UnitActionItem[]> {

  // Строим фильтр для поиска
  const filter: Partial<UnitActionTable> = {};
  if (teamId) {
    filter.team_id = teamId;
  }

  const receivedUnitActions = await unitActionsRepository.find({
    where: filter,  // Применяем фильтр к запросу
    relations: ['unit'], // Добавляем связь с таблицей Unit
  });

  if (!receivedUnitActions) return [] as UnitActionItem[]

  const unitActions = receivedUnitActions
    .map(ac => {
      const action = {
        id: ac.action.id,
        title: ac.action.title,
        code: ac.action.code,
        modified: false,
        interruptible: ac.action.interruptible,
      } as ActionItem
      return {
        id: ac.id,
        action: action,
        koef: ac.koef,
        unitId: ac.unit_id,
        unitIdc: ac.unit.idc,
      } as UnitActionItem;
    });

  return unitActions;
}
// расписание команды
export async function getTeamShedule(
  teamId: number,
  teamScheduleRepository: Repository<TeamScheduleTable>
): Promise<ScheduleItem> {
  // Строим фильтр для поиска
  // const filter: any = {};
  // if (teamId) {
  //   filter.team_id = teamId;
  // }

  const filter: FindOptionsWhere<TeamScheduleTable> = { team_id: teamId };

  const receivedSchedule = await teamScheduleRepository.find({
    where: filter,  // Применяем фильтр к запросу
    relations: ['team'], // Добавляем связь с таблицей team
  });

  if (!receivedSchedule || receivedSchedule.length === 0) return {} as ScheduleItem;

  const scheduleTable = receivedSchedule[0]
  const schedule = {
    team: scheduleTable.team,
    timeStartWork: scheduleTable.timeStartWork,
    timeFinishWork: scheduleTable.timeFinishWork,
    breaks: scheduleTable.breaks,
    holidays: scheduleTable.holidays.map(date => date.toLocaleDateString('en-CA')),
    weekends: scheduleTable.weekends,
    workdays: scheduleTable.workdays.map(workday => {
      return {
        date: new Date(workday.date).toLocaleDateString('en-CA'),
        timeStart: workday.timeStart,
        timeFinish: workday.timeFinish
      }
    }),
    timeZone: scheduleTable.timeZone as TimeZoneEnum,
  } as ScheduleItem;


  return schedule;
}
// настройки команды
export async function getSettings(
  teamId: number,
  settingsRepository: Repository<SettingsTable>
): Promise<SettingsItem> {
  // Строим фильтр для поиска
  const filter: Partial<SettingsTable> = {};
  if (teamId) {
    filter.team_id = teamId;
  }

  const receivedSettings = await settingsRepository.find({
    where: filter,  // Применяем фильтр к запросу
    relations: ['team'], // Добавляем связь с таблицей team
  });

  if (!receivedSettings || receivedSettings.length === 0) return {} as SettingsItem;

  const settingsTable = receivedSettings[0]
  const settings = {
    team: settingsTable.team,
    timeStartWork: settingsTable.timeStartWork,
    timeFinishWork: settingsTable.timeFinishWork,
    showHoliday: settingsTable.showHoliday,
    showWeekend: settingsTable.showWeekend,
    isQualControl: settingsTable.isQualControl,
  } as SettingsItem;


  return settings;
}

//  ПОЛУЧЕНИЕ ОПЕРАЦИИ ПО ID
export async function getTCardOperation(
  operId: number,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem | undefined> {
  // Строим фильтр для поиска по id карты
  const filter: Partial<TCardOperationTable> = {};

  if (operId) {
    filter.id = operId;
  }

  // Получаем карту по id
  const tCardOpertab = await tCardOperationsRepository.findOne({
    where: filter,  // Применяем фильтр к запросу
    relations: ['stage', 'action'],  // Указываем связанные таблицы (если необходимо)
  });

  // Проверяем, что карта существует
  if (!tCardOpertab) return undefined;

  // Преобразуем операцию карты    
  return {

    id: tCardOpertab.id,
    idc: tCardOpertab.idc,
    stage: tCardOpertab.stage,
    order: tCardOpertab.order,
    out: [],
    inn: [],
    action: tCardOpertab.action,
    duration: tCardOpertab.duration,
    status: tCardOpertab.status,
    coment: tCardOpertab.coment
  };

}

// получение операций по ID ОПЕРАЦИЙ
export async function getTCardOperations(
  operIds: number[],
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem[]> {


  if (operIds.length === 0) {
    // Если нет  карт то нет и операций по ним
    return [] as TCardOperationItem[];
  }

  const tCardOperstab = await tCardOperationsRepository.find({
    where: { id: In(operIds) }, // Фильтруем по полю unit_id для всех заданных юнитов
    relations: ['stage', 'action', 'tcard'],
  });

  const tCardOpers = tCardOperstab.map(tCardOpertab => {

    return {
      id: tCardOpertab.id,
      idc: tCardOpertab.idc,
      stage: tCardOpertab.stage,
      order: tCardOpertab.order,
      out: [],
      inn: [],
      action: {
        id: tCardOpertab.action.id,
        title: tCardOpertab.action.title,
        code: tCardOpertab.action.code,
        interruptible: tCardOpertab.action.interruptible,
      } as ActionItem,
      duration: tCardOpertab.duration,
      status: tCardOpertab.status,
      coment: tCardOpertab.coment,
    } as TCardOperationItem;
  });

  return tCardOpers;
}
// получение операций по ID карт
export async function getTCardOperationsByCardId(

  tCardId: number,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem[]> {

  const tCardOperstab = await tCardOperationsRepository.find({
    where: { tcard_id: tCardId }, // Фильтруем по полю tcard_id все операции
    relations: ['stage', 'action', 'tcard'],
  });

  const tCardOpers = tCardOperstab.map(tCardOpertab => {

    return {
      id: tCardOpertab.id,
      idc: tCardOpertab.idc,
      stage: tCardOpertab.stage,
      order: tCardOpertab.order,
      out: [],
      inn: [],
      action: {
        id: tCardOpertab.action.id,
        title: tCardOpertab.action.title,
        code: tCardOpertab.action.code,
        interruptible: tCardOpertab.action.interruptible,
      } as ActionItem,
      duration: tCardOpertab.duration,
      status: tCardOpertab.status,
      coment: tCardOpertab.coment,
      fixOperIdc: tCardOpertab.fix_oper_idc,
    }
  });

  return tCardOpers;
}
// получение юнитов пользователей команды
export async function getUsersUnits(
  teamId: number,
  usersRepository: Repository<UserTable>,
  usersUnitsRepository: Repository<UserUnitTable>,
  userId?: number, // Добавляем необязательный параметр userId
): Promise<{ success: boolean, userUnits: UserUnitItem[], message: string }> {


  try {
    // Шаг 1: Формируем условие для поиска пользователей
    const userCondition = userId ? { id: userId, team_id: teamId, isAdmin: false, active: true } : { team_id: teamId, isAdmin: false, active: true };

    // Получаем пользователей по условию
    const activeUsers = await usersRepository.find({ where: userCondition });


    // Шаг 1: Получаем всех пользователей команды
    // const activeUsers = await usersRepository.find({ where: { team_id: teamId, isAdmin: false, active: true } });
    // Если активные пользователи не найдены
    if (activeUsers.length === 0) {
      return {
        success: false,
        userUnits: [],
        message: 'Нет активных пользователей.',
      };
    }
    const usersUnits = await usersUnitsRepository.find({ where: { team_id: teamId } });

    // Шаг 3: Преобразуем данные в формат UserUnitItem 
    const userUnits: UserUnitItem[] = activeUsers.map(user => {
      const userUnit = usersUnits.find(u => u.user_id === user.id);

      if (!userUnit) {
        return {
          id: NaN,
          userId: user.id,
          name: user.name,
          unit: null,  // У юнита нет данных         
          active: false,
        };
      } else
        // Если для пользователя есть один или несколько юнитов
        return {
          id: userUnit.id,
          userId: userUnit.user_id,
          name: userUnit.user.name,
          unit: {
            id: userUnit.unit?.id,              // ID юнита
            title: userUnit.unit?.title,        // Название юнита
            code: userUnit.unit?.code || '',    // Код юнита (если есть)
            retool: userUnit.unit?.retool,      // Время на переналадку
            belong: userUnit.unit?.belong,      // Принадлежность юнита (enum)
            type: userUnit.unit?.type,          // Тип юнита (enum)
            coment: userUnit.unit?.coment,      // Комментарий юнита (если есть)
            active: userUnit.unit?.active,        // Статус активности
          } as UnitItem,
          active: userUnit.active,
        } as UserUnitItem;
    })
    return {
      success: true,
      userUnits: userUnits,
      message: 'Данные успешно получены.',
    };

    // } catch (e: any) {
    //   return {
    //     success: false,
    //     userUnits: [],
    //     message: `Ошибка при получении данных: ${e.message}`,
    //   };
    // }
  } catch (e: unknown) {
    let message = "Ошибка при получении данных.";
    if (e instanceof Error) {
      message = `Ошибка при получении данных: ${e.message}`;
    }
    return {
      success: false,
      userUnits: [],
      message,
    };
  }
}


// получение пользователей команды
export async function getUsers(
  teamId: number,
  usersRepository: Repository<UserTable>,
): Promise<{ success: boolean, users: UserItem[], message: string }> {

  try {
    // Шаг 1: Получаем всех пользователей команды
    const users = await usersRepository.find({ where: { team_id: teamId, isAdmin: false } });

    // Если активные пользователи не найдены
    if (users.length === 0) {
      return {
        success: false,
        users: [],
        message: 'Нет пользователей.',
      };
    }

    const users_ = users.map(user => {
      return {
        id: user.id,
        login: "",
        pass: "",
        name: user.name,
        locale: user.locale,
        isAdmin: user.isAdmin,
        active: user.active,
      } as UserItem
    });

    return {
      success: true,
      users: users_,
      message: 'Данные успешно получены.',
    };

    // } catch (e: any) {
    //   return {
    //     success: false,
    //     users: [],
    //     message: `Ошибка при получении данных: ${e.message}`,
    //   };
    // }
  } catch (e: unknown) {
    let message = "Ошибка при получении данных.";
    if (e instanceof Error) {
      message = `Ошибка при получении данных: ${e.message}`;
    }
    return {
      success: false,
      users: [],
      message,
    };
  }

}


// счета
export async function getBills(
  teamId: number,
  billsRepository: Repository<BillTable>
): Promise<BillItem[]> {

  // Строим фильтр для поиска

  const filter: { team_id?: number; } = {};

  if (teamId) {
    filter.team_id = teamId;
  }

  // Выполняем запрос с фильтрацией
  const receivedBills = await billsRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });
  // console.log(receivedUOMS);

  const bills__ = receivedBills
    .map(bill => {
      return {
        id: bill.id,
        date: new Date(bill.date).toLocaleDateString('en-CA'),
        title: bill.title,
        file: bill.fileContent,
        teamId: bill.team_id,
        paid: bill.paid,
      } as BillItem;
    });

  return bills__;
}

// тех поддержка
export async function getSuportMessages(
  teamId: number,
  supportRepository: Repository<SupportTable>
): Promise<SupportMessageItem[]> {

  // Строим фильтр для поиска

  const filter: { team_id?: number; } = {};

  if (teamId) {
    filter.team_id = teamId;
  }

  // Выполняем запрос с фильтрацией
  const receivedSuportMessages = await supportRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });
  // console.log(receivedUOMS);

  const suportMessages = receivedSuportMessages
    .map(mes => {
      return {
        id: mes.id,
        date: new Date(mes.date).toLocaleDateString('en-CA'),
        title: mes.title,
        body: mes.body,
        userId: mes.user_id,
        fromUser: mes.fromUser,
        basedOn: mes.basedOn,
      };
    });

  return suportMessages;
}