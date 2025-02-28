
import { Repository, In } from 'typeorm';
// tables
import { UnitTable } from '@/pages/db/models/catalogs/units'
import { CompanyTable } from '@/pages/db/models/catalogs/companies'
import { UnitActionTable } from '@/pages/db/models/catalogs/unit_actions'
import { UnitLoadTable } from '@/pages/db/models/plan/unit-loads';
import { TCardTable } from '@/pages/db/models/data/t_cards'
import { TCardProductTable } from '@/pages/db/models/data/t_card_products'
import { TCardOperationTable } from '@/pages/db/models/data/t_card_operations'
import { TypeEnum } from '@/pages/db/models/enums';
import { ActionTable } from '@/pages/db/models/catalogs/actions';
import { UOMsTable } from '@/pages/db/models/catalogs/uoms';
import { UnitExceptionTable } from '@/pages/db/models/plan/unit-exceptions';
import { CompanyScheduleTable } from '@/pages/db/models/plan/company-schedule';
import { SettingsTable } from '@/pages/db/models/plan/settings';
// types
import { UnitItem, UnitLoadItem, UnitActionItem, UnitBelongEnum, UnitTypeEnum, UnitExceptionItem, TimeTypeEnum, DaysOfWeek, TimeZoneEnum } from '@/types';
import { TCardItem, TCardOperationItem, TCardProductItem, StatusEnum, TCardStageItem, ActionItem, UOMItem, ScheduleItem, SettingsItem } from '@/types';


export async function getUOMs(
  companyId: number,
  uomsRepository: Repository<UOMsTable>
): Promise<UOMItem[]> {
  // Строим фильтр для поиска
  const filter: any = {};
  if (companyId) {
    filter.company_id = companyId;
  }

  // Выполняем запрос с фильтрацией
  const receivedUOMS = await uomsRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });
  console.log(receivedUOMS);

  const uoms__ = receivedUOMS
    .map(uom => {
      return {
        id: uom.id,
        title: uom.title,
      };
    });

  return uoms__;
}

export async function getActions(
  companyId: number,
  actionsRepository: Repository<ActionTable>
): Promise<ActionItem[]> {
  // Строим фильтр для поиска
  const filter: any = {};
  if (companyId) {
    filter.company_id = companyId;
  }

  // Выполняем запрос с фильтрацией
  const receivedActions = await actionsRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });
  console.log(receivedActions);

  const actions__ = receivedActions
    .map(action => {
      return {
        id: action.id,
        title: action.title,
        interruptible: action.interruptible
      } as ActionItem;
    });


  return actions__;
}

export async function getUnits(
  companyId: number,
  unitRepository: Repository<UnitTable>,
  unitActionsRepository: Repository<UnitActionTable>): Promise<UnitItem[]> {
  // Строим фильтр для поиска
  const filter: any = {};
  if (companyId) {
    filter.company_id = companyId;
  }

  // Выполняем запрос с фильтрацией
  const receivedUnits = await unitRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });

  if (!receivedUnits) return [] as UnitItem[]

  const unitIds = receivedUnits.map(unit => unit.id);

  const filter1: any = {};
  if (unitIds.length > 0) {
    filter1.unit_id = In(unitIds);  // Используем In() для фильтрации по массиву ID
  }

  // Выполняем запрос с фильтрацией
  const receivedActionsUnit = await unitActionsRepository.find({
    where: filter1,  // Применяем фильтр к запросу
  });

  // console.log(receivedUnits);

  const units = receivedUnits
    .map(unit => {

      let actions: UnitActionItem[] = receivedActionsUnit
        .filter(unitAction => unitAction.unit_id === unit.id)
        .map(unitAction => {
          return ({
            id: unitAction.id,
            action: unitAction.action,
            koef: unitAction.koef
          })
        })

      return {
        id: unit.id,
        title: unit.title,
        code: unit.code,
        actions: actions,
        retool: unit.retool,
        modified: false,
        belong: unit.belong as UnitBelongEnum,
        type: unit.type as UnitTypeEnum,
        coment: unit.coment
      };
    });

  return units;
}

export async function getUnitLoads(
  units: UnitItem[],
  unitLoadRepository: Repository<UnitLoadTable>
): Promise<UnitLoadItem[]> {

  // Получаем загрузки юнитов начиная с начала сегодняшнего дня
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Убираем время, чтобы сравнивать только дату


  const unitIds = units.map(unit => unit.id); // Получаем массив идентификаторов

  if (unitIds.length === 0) {
    // Если нет юнитов, можно вернуть пустой результат или обработать ошибку
    return [];
  }

  const unitLoads = await unitLoadRepository.createQueryBuilder('unitLoad')
    // .where('unitLoad.date >= :today', { today })
    .andWhere('unitLoad.unit_id IN (:...unitIds)', { unitIds }) // Фильтруем по unitIds
    .getMany();

  const unitLoadItems: UnitLoadItem[] = unitLoads.map(unitLoad => {

    let unit = units.find(unit => unit.id === unitLoad.unit_id)

    return {
      id: unitLoad.id,
      unit: (unit) ? unit : {} as UnitItem,  // он по любому существует
      date: String(unitLoad.date),
      idc_oper: unitLoad.idc_oper,
      id_tCard: unitLoad.id_tCard,
      timeStart: unitLoad.timeStart,
      timeFinish: unitLoad.timeFinish,
      status: StatusEnum.Pl  // дописать из операции статус
    };
  });

  // // Группируем загрузки по юнитам
  // const unitLoadItems: UnitLoadItem[] = units.map((unit) => {
  //   // Фильтруем загрузки для текущего юнита
  //   const unitLoadForUnit = unitLoads.filter(load => load.unit.id === unit.id);

  //   // Группируем загрузки по дате
  //   const groupedByDate: { [key: string]: LoadItem[] } = {};

  //   unitLoadForUnit.forEach(load => {
  //     const loadDate = load.date.toLocaleDateString('en-CA'); // Получаем строковое представление даты (YYYY-MM-DD)

  //     // Если для этой даты еще нет записи, создаем пустой массив
  //     if (!groupedByDate[loadDate]) {
  //       groupedByDate[loadDate] = [];
  //     }

  //     // Добавляем загрузку в массив для этой даты
  //     groupedByDate[loadDate].push({
  //       idc_oper: load.idc_oper,
  //       id_tCard: load.id_tCard,
  //       timeStart: load.timeStart,
  //       timeFinish: load.timeFinish,
  //       draft: true,
  //     });
  //   });

  //   // Преобразуем в формат UnitDateItem, где для каждой даты свой список загрузок
  //   const unitDates: UnitDateItem[] = Object.keys(groupedByDate).map(date => {
  //     return {
  //       date: new Date(date), // Конвертируем строку обратно в объект Date
  //       loads: groupedByDate[date] // Загружаем операции для этой даты
  //     };
  //   });

  //   // Сортируем unitDates по дате
  //   unitDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  //   // Возвращаем объект с юнитом и его датами загрузки
  //   return {
  //     unit,
  //     unitDates
  //   };
  // });

  return unitLoadItems;
}

export async function getTCard(
  tcardId: number,
  tCardRepository: Repository<TCardTable>
): Promise<TCardItem | undefined> {
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
  if (!tCardtab) return undefined;

  // Преобразуем карты    
  return {
    id: tCardtab.id,
    date: tCardtab.date,
    number: tCardtab.number || 1,  // Если number не заполнен, возвращаем "1"
    modified: true,  // Например, помечаем, что карта изменена
    maxId: tCardtab.max_idc,
    coment: tCardtab.coment,
    status: tCardtab.status
  };

}
export async function getTCardMatOper(
  tcardId: number,
  tCardOperationsRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
): Promise<{ tCardMaterials: TCardProductItem[], tCardOperations: TCardOperationItem[] }> {

  // Получаем связанные данные: стадию, операции, продукты, отходы и материалы
  const tCardOperationstab = await tCardOperationsRepository.find({ where: { tcard_id: tcardId } });
  const tCardProductstab = await tCardProductRepository.find({ where: { tcard_id: tcardId } });

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
        stage: {} as TCardStageItem, //  Это чисто для визуала и для расчетов не нужно
        out: out,
        inn: inn,
        action: { id: oper.action.id, title: oper.action.title, interruptible: oper.action.interruptible },
        duration: oper.duration, // в милисекундах   
        status: oper.status,
      };
    });


  return { tCardMaterials: tCardMaterialsg_, tCardOperations: tCardOperationsg_ }
}

export async function getExceptions(
  companyId: number,
  unitExceptionsRepository: Repository<UnitExceptionTable>): Promise<UnitExceptionItem[]> {
  // Строим фильтр для поиска
  const filter: any = {};
  if (companyId) {
    filter.company_id = companyId;
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
        date: exception.date,
        type: exception.type as TimeTypeEnum,
        timeStart: exception.timeStart,
        timeFinish: exception.timeFinish,
      } as UnitExceptionItem;
    });

  return excertions;
}

export async function getCompanyShedule(
  companyId: number,
  companyScheduleRepository: Repository<CompanyScheduleTable>
): Promise<ScheduleItem> {
  // Строим фильтр для поиска
  const filter: any = {};
  if (companyId) {
    filter.company_id = companyId;
  }

  const receivedSchedule = await companyScheduleRepository.find({
    where: filter,  // Применяем фильтр к запросу
    relations: ['company'], // Добавляем связь с таблицей company
  });

  if (!receivedSchedule || receivedSchedule.length === 0) return {} as ScheduleItem;

  let scheduleTable = receivedSchedule[0]
  const schedule = {
    company: scheduleTable.company,
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
      }}),
    timeZone: scheduleTable.timeZone as TimeZoneEnum,
  } as ScheduleItem;


  return schedule;
}

export async function getSettings(
  companyId: number,
  settingsRepository: Repository<SettingsTable>
): Promise<SettingsItem> {
  // Строим фильтр для поиска
  const filter: any = {};
  if (companyId) {
    filter.company_id = companyId;
  }

  const receivedSettings = await settingsRepository.find({
    where: filter,  // Применяем фильтр к запросу
    relations: ['company'], // Добавляем связь с таблицей company
  });

  if (!receivedSettings || receivedSettings.length === 0) return {} as SettingsItem;

  let settingsTable = receivedSettings[0]
  const settings = {
    company: settingsTable.company,
    timeStartWork: settingsTable.timeStartWork,
    timeFinishWork: settingsTable.timeFinishWork,
    showHoliday: settingsTable.showHoliday,
    showWeekend: settingsTable.showWeekend,


  } as SettingsItem;


  return settings;
}
