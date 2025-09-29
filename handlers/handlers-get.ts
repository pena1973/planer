
import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual, FindManyOptions, FindOptionsWhere, Not } from 'typeorm';
import { ulogger } from "./../lib/common/universal-logger";

// tables
import { UnitTable } from './../db/models/catalogs/units'
import { UnitActionTable } from './../db/models/catalogs/unit_actions'
import { UnitLoadTable } from './../db/models/plan/unit_loads';
import { TCardTable } from './../db/models/data/t_cards'
import { TCardProductTable } from './../db/models/data/t_card_products'
import { ProductTable } from './../db/models/data/products'
import { TCardOperationTable } from './../db/models/data/t_card_operations'
import { TCardStageTable } from './../db/models/data/t_card_stages'
import { TemplateTable } from './../db/models/catalogs/templates'

import { SupportMailItem, TypeEnum } from './../types/types';
import { ActionTable } from './../db/models/catalogs/actions';
import { UOMsTable } from './../db/models/catalogs/uoms';
import { UnitExceptionTable } from './../db/models/plan/unit_exceptions';
import { TeamScheduleTable } from './../db/models/plan/team_schedule';
import { SettingsTable } from './../db/models/plan/settings';

import { UserTable } from './../db/models/catalogs/users';
import { UserUnitTable } from './../db/models/catalogs/user_unit';
import { InvoiceTable } from './../db/models/billing/invoice';
import { ClientTable } from './../db/models/billing/clients';

import { MailTable } from './../db/models/support/mails';

import { TeamTable } from './../db/models/catalogs/teams';
import { BanerTable } from './../db/models/support/baners';
import { BalanceTable } from './../db/models/billing/balance';
import { MainTable } from './../db/models/billing/main';
import { ActiveTimeTable } from "./../db/models/billing/active_time";
// types
import {
  StatusEnum, UserItem, UnitItem, UnitLoadItem,
  UnitActionItem, UnitBelongEnum, UnitTypeEnum, UnitExceptionItem,
  TimeTypeEnum, TimeZoneEnum, TCardOperationTermsItem,
  TCardItem, TCardOperationItem, TCardProductItem, UserUnitItem,
  TCardStageItem, ActionItem, UOMItem, ScheduleItem, SettingsItem,
  TCardTermsItem, ProductItem, TemplateItem, TeamItem
} from './../types/types';

import { ClientItem, InvoiceItem, MainItem } from './../types/service-types';
import { BanerItem } from './../types/service-types';

import { getTeam } from './../handlers/handlers-auth';
import { getTimeZoneDateFromDateString } from "@/lib/common/timezone"
import { YYYYMMDD } from "@/lib/common/utils"

//&&&&&&
export async function getMain(
  userId: number | null,
  // locale: string,
  mainRepository: Repository<MainTable>,
  at: Date | string
): Promise<MainItem | null> {

  // const toYMD = (d: Date | string) => typeof d === "string" ? d : d.toISOString().slice(0, 10);
  // const date = toYMD(at);

  const date = YYYYMMDD(at);

  const row = await mainRepository.findOne({
    where: { from: LessThanOrEqual(date) as any }, // varchar 'YYYY-MM-DD' сравнивается лексикографически как дата
    order: { from: "DESC" },                       // берём ближайшую к дате
  });

  if (!row) {
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getMain",
      event: "error",
      message: `date=${date}(!row)-> return {} as MainItem`,
      context: "const row = await mainRepository.findOne({",
    }).catch(() => { console.error("logger error") });

    return null
  }

  const main = {
    title: row.title,
    reg_n: row.reg_n,
    adress: row.adress,
    email: row.email,
    phone: row.phone,
    person: row.person,
    price: row.price,
    discount: row.discount,
    from: row.from,
    VAT: row.VAT
  } as MainItem;

  return main;
}

export async function getCostForDay(
  userId: number | null,
  locale: string,
  teamId: number,
  day: string,  // yyyy-mm-dd
  teamsRepository: Repository<TeamTable>,
  activeTimeRepository: Repository<ActiveTimeTable>,
  mainRepository: Repository<MainTable>,
): Promise<number> {

  // тип минимум, который нужен для логики «включено/выключено»
  type HasDirection = Pick<ActiveTimeTable, 'direction'>;

  function isEnableEvent(row: HasDirection): boolean {
    return row.direction === 'start';
  }
  function getDaysInMonth(dayStr: string): number {
    const [year, month] = dayStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }

  const daysInMonth: number = getDaysInMonth(day);

  // настройки цены
  const main = await getMain(userId, mainRepository, day);
  if (!main) {
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getCostForDay",
      event: "error",
      message: `userId=${userId}day=${day} (!main) -> return 0`,
      context: "const main = await getMain(userId, mainRepository, day)",
    }).catch(() => { console.error("logger error") });

    return 0;
  }

  const price = main.price * 100; // в центах
  const discount = main.discount;

  // главная команда
  const resTeam = await getTeam(userId, locale, teamId, teamsRepository);
  if (!resTeam.success || !resTeam.team) return NaN;
  const mainTeamInGrope = resTeam.team;

  // код группы
  const groupCode = mainTeamInGrope.main_team;

  // все команды группы
  const teams = await getTeamsByMainteamNumber(userId, locale, String(groupCode), teamsRepository);
  const uniqIds = Array.from(new Set(teams.map(t => t.id)));
  if (!uniqIds.length) return 0;

  // === 1) события В ДЕНЬ (любые): если есть — день считается использованным
  // select только нужные колонки, без any
  const eventsToday = await activeTimeRepository.find({
    select: ['team_id', 'date', 'direction'],
    where: { team_id: In(uniqIds), date: day },
  });

  const usedToday = new Set<number>(eventsToday.map(e => e.team_id));

  // === 2) последнее событие ДО ДНЯ для каждой команды
  // Важно: обязательно вернуть direction!
  const priorLatestRows: Array<Pick<ActiveTimeTable, 'team_id' | 'date' | 'direction'>> =
    await activeTimeRepository.query(
      `
      SELECT a.team_id, a.date, a.direction
      FROM active_time a
      JOIN (
        SELECT team_id, MAX(date) AS max_date
        FROM active_time
        WHERE team_id = ANY($1) AND date < $2
        GROUP BY team_id
      ) m
        ON a.team_id = m.team_id AND a.date = m.max_date
      `,
      [uniqIds, day]
    );

  if (priorLatestRows.length === 0) {
    //  logger
    void ulogger.warn({
      userId: userId,
      location: "handlers/handlers-get/getCostForDay",
      event: "warn",
      message: `нет активного времени для вычисления цены что подозрительно: userId=${userId} day=${day} teamId=${teamId}`,
      context: "const priorLatestRows: Array<Pick<ActiveTimeTable, 'team_id' | 'date' | 'direction'>> =",
    }).catch(() => { console.error("logger error") });
  }

  const activeBeforeDay = new Map<number, boolean>();
  for (const r of priorLatestRows) {
    activeBeforeDay.set(Number(r.team_id), isEnableEvent(r)); // true если последнее ДО дня — start
  }

  // === 3) финальный набор команд, по которым списываем:
  // - если есть событие в сам день → списываем независимо от типа (даже если finish)
  // - иначе смотрим последнее событие ДО дня: start → списываем, finish/нет событий → нет
  const chargeTeamIds = new Set<number>();
  for (const id of uniqIds) {
    if (usedToday.has(id)) {
      chargeTeamIds.add(id);
      continue;
    }
    const wasActive = activeBeforeDay.get(id);
    if (wasActive === true) {
      chargeTeamIds.add(id);
    }
  }

  // === 4) расчёт дневной стоимости (в центах), округление до целого
  let dayCost = 0;
  const dayPrice = price / daysInMonth;
  for (const team of teams) {
    if (chargeTeamIds.has(team.id)) {
      const cost = (team.id === mainTeamInGrope.id)
        ? dayPrice
        : dayPrice * (1 - discount / 100);
      dayCost += Math.round(cost);
    }
  }
  return dayCost; // в центах
}


// баланс команды
export async function getBalance(
  userId: number | null,
  date: Date | string,   // yyyy-mm-dd
  teamId: number,
  balanceRepository: Repository<BalanceTable>
): Promise<number> {
  const target = YYYYMMDD(date) // yyyy-mm-dd

  // тянем только нужные строки: команда + все транзакции на дату и раньше
  const rows = await balanceRepository.find({
    where: { team_id: teamId, date: LessThanOrEqual(target) },
    select: ['summa', 'direction', 'date'],
  })

  if (rows.length === 0) {
    //  logger
    void ulogger.warn({
      userId: userId,
      location: "handlers/handlers-get/getBalance",
      event: "warn",
      message: `нет записей баланса что подозрительно: userId=${userId} date=${target} teamId=${teamId}`,
      context: "const rows = await balanceRepository.find({",
    }).catch(() => { console.error("logger error") });
  }
  // суммируем с учётом направления
  const total = rows.reduce((acc, tr) => {
    const amount = Number(tr.summa) || 0;
    switch (tr.direction) {
      case '+':
        return acc + amount;
      case '-':
        return acc - amount;
      default:
        return acc;
    }
  }, 0);

  return Math.round((total + Number.EPSILON) * 100) / 100 || 0; // если NaN, то отдаём 0
}

export async function getBalances(
  userId: number,
  date: Date | string,
  balanceRepository: Repository<BalanceTable>,
  teamIds?: number[] // опционально: посчитать только для заданных команд
): Promise<Array<{ teamId: number; balance: number }>> {
  const target = typeof date === 'string'
    ? date
    : date.toISOString().slice(0, 10) // yyyy-mm-dd

  const qb = balanceRepository
    .createQueryBuilder('b')
    .select('b.team_id', 'teamId')
    .addSelect(
      `SUM(
         CASE
           WHEN b.direction = '+' THEN COALESCE((b.summa)::numeric, 0)
           WHEN b.direction = '-' THEN -COALESCE((b.summa)::numeric, 0)
           ELSE 0
         END
       )`,
      'balance'
    )
    .where('b.date <= :target', { target })

  if (teamIds && teamIds.length > 0) {
    qb.andWhere('b.team_id IN (:...teamIds)', { teamIds })
  }

  qb.groupBy('b.team_id')

  const rows = await qb.getRawMany<{ teamId: string; balance: string }>()

  const result = rows.map(r => ({
    teamId: Number(r.teamId),
    balance: Number(r.balance ?? 0),
  }))

  // Если нужно вернуть нули для команд без транзакций — раскомментируй блок ниже:

  if (teamIds && teamIds.length > 0) {
    const map = new Map(result.map(x => [x.teamId, x.balance]))
    return teamIds.map(id => ({
      teamId: id,
      balance: Number(map.get(id) ?? 0),
    }))
  }
  return result
}

// все команды
export async function getTeams(
  userId: number | null,
  locale: string,
  teamsRepository: Repository<TeamTable>
): Promise<TeamItem[]> {

  const receivedTeams = await teamsRepository.find();

  const activeTeams = receivedTeams
    .map(team => {
      return {
        id: team.id,
        title: team.title,
        coment: team.coment,
        prefix: team.prefix,
        main_team: team.main_team
      } as TeamItem;
    });
  return activeTeams;
}

// состояние активности команд
export async function getTeamActivity(
  userId: number | null,
  locale: string,
  teams: TeamItem[],
  activeTimeRepository: Repository<ActiveTimeTable>
): Promise<{ teamId: number; active: boolean }[]> {
  if (!teams || teams.length === 0) return [];

  const teamIds = teams.map(t => t.id);
  const today = YYYYMMDD();
  // const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  // Берём все события для нужных команд c датой <= сегодня
  const rows = await activeTimeRepository.find({
    where: {
      team_id: In(teamIds),
      date: LessThanOrEqual(today),
    },
    order: {
      team_id: "ASC",
      date: "ASC",        // строка формата YYYY-MM-DD сортируется корректно как по дате
      created_at: "ASC",  // на случай нескольких записей в один день
    },
  });

  // Последнее событие по каждой команде
  const lastByTeam = new Map<number, ActiveTimeTable>();
  for (const r of rows) {
    lastByTeam.set(r.team_id, r); // т.к. отсортировано по возрастанию, последняя запись «перетрёт» предыдущую
  }

  // Сформировать ответ только по переданному списку команд
  return teamIds.map((id) => {
    const last = lastByTeam.get(id);
    const active = !!last && last.direction === "start";
    return { teamId: id, active };
  });
}

// все команды по главной
export async function getTeamsByMainteamNumber(
  userId: number | null,
  locale: string,
  main_team: string,
  teamsRepository: Repository<TeamTable>
): Promise<TeamItem[]> {

  const receivedAttachedTeams = await teamsRepository.find({
    where: { main_team: main_team },
  });

  const attachedTeams = receivedAttachedTeams
    .map(team => {
      return {
        id: team.id,
        title: team.title,
        coment: team.coment,
        prefix: team.prefix,
        main_team: team.main_team
      } as TeamItem;
    });
  return attachedTeams;
}

export async function getClient(
  userId: number,
  locale: string,
  teamId: number,
  clientRepository: Repository<ClientTable>
): Promise<ClientItem> {

  const receivedClient = await clientRepository.findOne({
    where: { team_id: teamId },
  });

  const client = {
    address_line1: receivedClient?.address_line1 ?? "",
    address_line2: receivedClient?.address_line2 ?? "",
    city: receivedClient?.city ?? "",
    postal_code: receivedClient?.postal_code ?? "",
    email: receivedClient?.email ?? "",
    phone: receivedClient?.phone ?? "",
    reg_n: receivedClient?.reg_n ?? "",
    title: receivedClient?.title ?? "",
    country: receivedClient?.country ?? "",
    customerId: receivedClient?.customer_id ?? "",
  } as ClientItem;

  return client;
}
export async function getClients(
  userId: number,
  locale: string,
  clientRepository: Repository<ClientTable>
): Promise<ClientItem[]> {

  const receivedClients = await clientRepository.find({});
  if (!receivedClients) { return [] as ClientItem[] }

  const clients = receivedClients
    .map(client => {
      return {
        address_line1: client.address_line1,
        address_line2: client.address_line2,
        city: client.city,
        postal_code: client.postal_code,
        email: client.email,
        phone: client.phone,
        reg_n: client.reg_n,
        title: client.title,
        teamId: client.team_id,
        country: client?.country ?? "",
        customerId: client?.customer_id ?? "",
      } as ClientItem;
    })

  return clients;
}

// &&&&
// единицы измерения
export async function getUOMs(
  userId: number,
  locale: string,
  teamId: number,
  uomsRepository: Repository<UOMsTable>
): Promise<UOMItem[]> {

  const receivedUOMS = await uomsRepository.find({
    where: { team_id: teamId },
  });

  const uoms = receivedUOMS
    .map(uom => {
      return {
        id: uom.id,
        code: uom.code,
        title: uom.title,
      } as UOMItem;
    });
  return uoms;
}

// &&&&
//  операции команды
export async function getActions(
  userId: number,
  locale: string,
  teamId: number,
  actionsRepository: Repository<ActionTable>
): Promise<ActionItem[]> {

  // Выполняем запрос с фильтрацией
  const receivedActions = await actionsRepository.find({
    where: { team_id: teamId },
  });
  // console.log(receivedActions);

  const actions = receivedActions
    .map(action => {
      return {
        id: action.id,
        code: action.code,
        title: action.title,
        interruptible: action.interruptible
      } as ActionItem;
    });

  return actions;
}

// &&&&
// юниты
export async function getUnits(
  userId: number,
  locale: string,
  teamId: number,
  unitRepository: Repository<UnitTable>,
  unitId?: number,
): Promise<UnitItem[]> {

  const receivedUnits = await unitRepository.find({
    where: { team_id: teamId, ...(unitId && { id: unitId }) },
  });

  const units = receivedUnits
    .map(unit => {
      return {
        id: unit.id,
        idc: unit.idc,
        title: unit.title,
        code: unit.code,
        retool: unit.retool,
        modified: false,
        belong: unit.belong as UnitBelongEnum,
        type: unit.type as UnitTypeEnum,
        coment: unit.coment,
        active: unit.active
      } as UnitItem;
    });

  return units;
}

// &&&&
// шаблоны
export async function getTemplates(
  userId: number,
  locale: string,
  teamId: number,
  templatesRepository: Repository<TemplateTable>
): Promise<TemplateItem[]> {

  const receivedTemplates = await templatesRepository.find({
    where: { team_id: teamId },
  });

  const templates = receivedTemplates
    .map(template => {
      return {
        id: template.id,
        name: template.name,
        fileContent: template.fileContent,

      } as TemplateItem;
    });
  return templates;
}

// &&&&
// Статусы лоадов
export async function getLoadStatuses(
  userId: number,
  locale: string,
  teamId: number,
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<{ idc_load: number, status: StatusEnum }[]> {

  return await unitLoadRepository
    .createQueryBuilder('unitLoad')
    .select('unitLoad.idc', 'idc_load')  // поле + алиас
    .addSelect('unitLoad.status', 'status')   // поле + алиас
    .where('unitLoad.team_id = :teamId', { teamId })
    .getRawMany<{ idc_load: number; status: StatusEnum }>();
}

// &&&&
// загрузка юнитов
export async function getUnitLoads(
  userId: number,
  locale: string,
  teamId: number,
  units: UnitItem[],
  unitLoadRepository: Repository<UnitLoadTable>,
  unitActionsRepository: Repository<UnitActionTable>,
  isControler: boolean = false,
): Promise<UnitLoadItem[]> {

  const unitIds = units.map(unit => unit.id);
  if (unitIds.length === 0) return [];

  const unitActions: UnitActionItem[] = await getUnitActions(userId, locale, teamId, unitActionsRepository)

  const query = unitLoadRepository
    .createQueryBuilder('unitLoad')
    .select('unitLoad')
    .leftJoin('t_cards', 'tCard', 'unitLoad.id_tCard = tCard.id')
    .addSelect(['tCard.id', 'tCard.idc', 'tCard.date'])
    .leftJoin('t_card_operations', 'tOper', 'unitLoad.id_oper = tOper.id')
    .addSelect(['tOper.id', 'tOper.duration', 'tOper.action_id'])
    .where('unitLoad.team_id = :teamId', { teamId })
    .where('unitLoad.unit_id IN (:...unitIds)', { unitIds });

  if (isControler) {
    query.andWhere('unitLoad.status = :status', { status: 'performed' });
  }
  const unitLoads = await query.getRawMany();

  const unitLoadItems: UnitLoadItem[] = unitLoads.map(row => {
    const unit = units.find(unit => unit.id === row.unitLoad_unit_id);
    const unitAction = unitActions.find(uAct => uAct.unitId === row.unitLoad_unit_id && uAct?.action.id === row.tOper_action_id);
    return {
      id: row.unitLoad_id,
      idc: row.unitLoad_idc,
      unit: unit ?? {} as UnitItem,
      // date: new Date(row.unitLoad_date).toLocaleDateString("en-CA"),
      date: YYYYMMDD(row.unitLoad_date),
      id_oper: row.unitLoad_id_oper,
      idc_oper: row.unitLoad_idc_oper,
      id_tCard: row.unitLoad_id_tCard,
      timeStart: row.unitLoad_timeStart,
      timeFinish: row.unitLoad_timeFinish,
      status: row.unitLoad_status,
      version: row.unitLoad_version,
      isActive: row.unitLoad_isActive,
      isRetool: row.unitLoad_isRetool,
      isPinned: row.unitLoad_isPinned,
      isOuterFinish: row.unitLoad_isOuterFinish,
      isOuterStart: row.unitLoad_isOuterStart,
      isFirst: row.unitLoad_isFirst,
      loadInfo: {
        tCardIdc: row.tCard_idc,
        // tCardDate: new Date(row.tCard_date).toLocaleDateString("en-CA"),
        tCardDate: YYYYMMDD(row.tCard_date),
        title: unitAction?.action.title ?? "",
        duration: row.tOper_duration,
        interruptible: unitAction?.action.interruptible ?? false,
        koef: unitAction?.koef ?? 1.00,
      },
    } as UnitLoadItem;
  });

  return unitLoadItems;
}

// id лоадов по операции с определенной версией
export async function getTCardOperationLoads(
  userId: number,
  locale: string,
  tCardId: number, // ID карты для фильтрации
  operId: number, // ID операции для фильтрации
  version: number, // Версия для фильтрации
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<number[]> {

  if (!tCardId) return [];

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
  userId: number,
  locale: string,
  tCard: TCardItem,
  units: UnitItem[],
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<UnitLoadItem[]> {
  // Создаём карту операций для быстрого поиска
  const operationMap = new Map<number, TCardOperationItem>();
  tCard.tCardOperations?.forEach(op => {
    if (op.id) operationMap.set(op.id, op);
  });

  // Загружаем лоады по карте
  const unitLoads = await unitLoadRepository
    .createQueryBuilder('unitLoad')
    .where('unitLoad.id_tCard = :tCardId', { tCardId: tCard.id })
    .getRawMany();

  return unitLoads.map(row => {
    // Юнит
    const unit = units.find(u => u.id === row.unitLoad_unit_id) ?? {
      id: 0,
      title: 'Неизвестный юнит',
      code: ''
    };

    // Операция
    const operation = operationMap.get(row.unitLoad_id_oper);

    return {
      id: row.unitLoad_id,
      idc: row.unitLoad_idc,
      unit,
      // date: new Date(row.unitLoad_date).toLocaleDateString('en-CA'),
      date: YYYYMMDD(row.unitLoad_date),
      id_oper: row.unitLoad_id_oper,
      idc_oper: row.unitLoad_idc_oper,
      id_tCard: row.unitLoad_id_tCard,
      timeStart: row.unitLoad_timeStart,
      timeFinish: row.unitLoad_timeFinish,
      status: row.unitLoad_status,
      version: row.unitLoad_version,
      isActive: row.unitLoad_isActive,
      isRetool: row.unitLoad_isRetool,
      isPinned: row.unitLoad_isPinned,
      isOuterFinish: row.unitLoad_isOuterFinish,
      isOuterStart: row.unitLoad_isOuterStart,
      isFirst: row.unitLoad_isFirst,
      loadInfo: {
        tCardIdc: tCard.idc,
        // tCardDate: new Date(tCard.date).toLocaleDateString('en-CA'),
        tCardDate: YYYYMMDD(tCard.date),
        title: operation?.action.title ?? '',
        duration: operation?.duration ?? 0,
        interruptible: operation?.action.interruptible ?? false,
        koef: 1
      }
    } as UnitLoadItem;
  });
}

// &&&&
// список карт только шапка
export async function getTCards(
  userId: number,
  locale: string,
  teamId: number,
  statuses: StatusEnum[],
  tCardRepository: Repository<TCardTable>
): Promise<TCardItem[]> {
  const tCards = await tCardRepository.find({
    where: { team_id: teamId, status: In(statuses) },
    select: ['id', 'date', 'idc', 'coment', 'status', 'max_idc'],
  });

  return (tCards || []).map(t => ({
    id: t.id,
    // date: new Date(t.date).toLocaleDateString("en-CA"),
    date: YYYYMMDD(t.date),
    idc: t.idc || 1,
    modified: false,
    maxIdc: t.max_idc,
    coment: t.coment,
    status: t.status
  }));
}

// КАРТА! только шапка
export async function getTCard(
  userId: number,
  locale: string,
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
    // relations: ['team', 'user'],  // Указываем связанные таблицы (если необходимо)
  });

  // Проверяем, что карта существует
  if (!tCardtab) return undefined;

  // Преобразуем карты    
  return {
    id: tCardtab.id,
    // date: new Date(tCardtab.date).toLocaleDateString("en-CA"),
    date: YYYYMMDD(tCardtab.date),
    idc: tCardtab.idc || 1,  // Если number не заполнен, возвращаем "1"
    modified: true,  // Например, помечаем, что карта изменена
    maxIdc: tCardtab.max_idc,
    coment: tCardtab.coment,
    status: tCardtab.status
  };

}

// &&&&
// КАРТА! Вместе с составными частями карты
export async function getTCardFull(
  userId: number,
  locale: string,
  teamId: number,
  tcardId: number,
  tCardRepository: Repository<TCardTable>,
  tCardOperationRepository: Repository<TCardOperationTable>,
  tCardProductRepository: Repository<TCardProductTable>,
  tCardStageRepository: Repository<TCardStageTable>,
  productRepository: Repository<ProductTable>,
  actionRepository: Repository<ActionTable>,

): Promise<TCardItem | undefined> {


  const tCardtab = tcardId ? await tCardRepository.findOne({ where: { id: tcardId } }) : null;

  // Проверяем, что карта существует
  if (!tCardtab) return undefined;

  // ДЕЙСТВИЯ
  const actionstab = await actionRepository.find({
    where: { team_id: teamId }
  });

  // Преобразуем действия
  const actions = actionstab
    .map(action => {
      return {
        id: action.id,
        title: action.title,
        code: action.code,
        interruptible: action.interruptible,
      } as ActionItem;
    });


  // СТАДИИ
  const tCardStagestab = await tCardStageRepository.find({
    where: { tcard_id: tcardId }
  });

  // Преобразуем стадии
  const tCardStages_ = tCardStagestab
    .map(stage => {
      return {
        id: stage.id,
        idc: stage.idc,
        code: stage.code,
      } as TCardStageItem;
    });


  //  КАТАЛОГ Продуктов
  const productstab = await productRepository
    .createQueryBuilder('product')
    .leftJoin('uoms', 'uom', 'product.uom_id = uom.id') // ручной JOIN
    .addSelect([
      'uom.id',
      'uom.title',
      'uom.code'
    ])
    .where('product.tcard_id = :tcardId', { tcardId })
    .getRawMany();

  const products_: ProductItem[] = productstab.map(row => ({
    id: row.product_id,
    idc: row.product_idc,
    title: row.product_title,
    sync: row.product_sync,
    uom: {
      id: row.uom_id,
      title: row.uom_title,
      code: row.uom_code,
    } as UOMItem,
  }));


  // Функция преобразования продукта
  const mapTCardProduct = (tProduct: TCardProductTable): TCardProductItem => {
    const product = products_.find(p => p.id === tProduct.product_id);
    return {
      id: tProduct.id,
      code: tProduct.code,
      qtu: tProduct.qtu,
      product: product ?? {} as ProductItem
    } as TCardProductItem;
  };

  // ПРОДУКТЫ, МАТЕРИАЛЫ, ОТХОДЫ
  const tCardProductstab = await tCardProductRepository.find({
    where: { tcard_id: tcardId },
  });

  // Группировка по типам
  const tCardMaterials_ = tCardProductstab
    .filter(tp => tp.type === TypeEnum.M)
    .map(mapTCardProduct);

  const tCardProducts_ = tCardProductstab
    .filter(tp => tp.type === TypeEnum.P)
    .map(mapTCardProduct);

  const tCardWastes_ = tCardProductstab
    .filter(tp => tp.type === TypeEnum.W)
    .map(mapTCardProduct);


  // ОПЕРАЦИИ
  const tCardOperationstab = await tCardOperationRepository
    .createQueryBuilder('oper')
    .leftJoin('actions', 'action', 'oper.action_id = action.id')
    .leftJoin('t_card_stages', 'stage', 'oper.stage_id = stage.id')
    .addSelect([
      'action.id', 'action.title', 'action.code', 'action.interruptible',
      'stage.id', 'stage.idc', 'stage.code'
    ])
    .where('oper.tcard_id = :tcardId', { tcardId })
    .getRawMany();

  // Преобразуем операции
  const tCardOperations_: TCardOperationItem[] = tCardOperationstab.map(raw => {
    const stage = tCardStages_.find(s => s.id === raw.oper_stage_id);
    const action = actions.find(s => s.id === raw.oper_action_id);
    return {
      id: raw.oper_id,
      idc: raw.oper_idc,
      stage: stage ?? {} as TCardStageItem,
      order: raw.oper_order,
      out: tCardProductstab
        .filter(p => p.operation_id === raw.oper_id && p.type === TypeEnum.O)
        .map(mapTCardProduct),
      inn: tCardProductstab
        .filter(p => p.operation_id === raw.oper_id && p.type === TypeEnum.I)
        .map(mapTCardProduct),
      action: action ?? {} as ActionItem,
      duration: raw.oper_duration,
      status: raw.oper_status,
      coment: raw.oper_coment,
      fixOperIdc: raw.oper_fix_oper_idc,
    } as TCardOperationItem
  });

  const tCard = {
    id: tCardtab.id,
    // date: new Date(tCardtab.date).toLocaleDateString("en-CA"),
    date: YYYYMMDD(tCardtab.date),
    idc: tCardtab.idc,
    products: products_,
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
  userId: number,
  locale: string,
  teamId: number,
  tCardIdc: number | undefined,
  tCardDateFrom: string | undefined,
  tCardDateTo: string | undefined,
  tCardStatus: StatusEnum | undefined,
  tCardRepository: Repository<TCardTable>,
  tCardOperationRepository: Repository<TCardOperationTable>,
  unitLoadRepository: Repository<UnitLoadTable>,
  timezone: string,
  showClosed: boolean
): Promise<{ tCardsTerms: TCardTermsItem[], loads: UnitLoadItem[] }> {

  const where: FindOptionsWhere<TCardTable> = {
    team_id: teamId,
  };

  if (tCardIdc) {
    where.idc = tCardIdc;
  }

  // const dateFrom = tCardDateFrom ? new Date(tCardDateFrom) : undefined;
  const dateFrom = tCardDateFrom ? getTimeZoneDateFromDateString(tCardDateFrom, timezone) : undefined;

  // const dateTo = tCardDateTo ? new Date(tCardDateTo) : undefined;
  const dateTo = tCardDateTo ? getTimeZoneDateFromDateString(tCardDateTo, timezone) : undefined;

  if (dateFrom) dateFrom.setHours(0, 0, 0, 0);
  if (dateTo) dateTo.setHours(23, 59, 59, 999);

  const toYMD = (d: string | Date) => typeof d === "string" ? d : d.toISOString().slice(0, 10);

  if (dateFrom && dateTo) {
    where.date = Between(toYMD(dateFrom), toYMD(dateTo));
  } else if (dateFrom) {
    where.date = MoreThanOrEqual(toYMD(dateFrom));
  } else if (dateTo) {
    where.date = LessThanOrEqual(toYMD(dateTo));
  }

  if (!showClosed) {
    where.status = Not(StatusEnum.closed);
  }

  if (tCardStatus) {
    where.status = tCardStatus;
  }


  // Создаем объект фильтра для карты
  const tCardFilter: FindManyOptions<TCardTable> = { where, };

  // Получаем все карты для заданной компании с фильтрацией
  const tCards = await tCardRepository.find(tCardFilter);


  const tCardTerms: TCardTermsItem[] = []; // массив на выход

  // Загружаем операции для всех карт
  const tCardsIds = tCards.map(card => card.id);

  const operationsData = await tCardOperationRepository
    .createQueryBuilder('oper')
    .leftJoin('t_card_stages', 'stage', 'oper.stage_id = stage.id')
    .leftJoin('actions', 'action', 'oper.action_id = action.id')
    .addSelect([
      'stage.id', 'stage.code', 'stage.idc',
      'action.id', 'action.title', 'action.code', 'action.interruptible'
    ])
    .where('oper.tcard_id IN (:...tCardsIds)', { tCardsIds })
    .getRawMany();


  // Загружаем лоады для всех операций
  const operationsIds = operationsData.map(row => row.oper_id);
  const loadsData = await unitLoadRepository
    .createQueryBuilder('unitLoad')
    .leftJoin('units', 'unit', 'unitLoad.unit_id = unit.id')
    .leftJoin('t_cards', 'tCard', 'unitLoad.id_tCard = tCard.id')
    .addSelect([
      'unit.id', 'unit.title', 'unit.code',
      'unit.idc', 'unit.retool', 'unit.belong',
      'unit.type', 'unit.coment', 'unit.active',
      'tCard.id', 'tCard.idc', 'tCard.date'
    ])
    .where('unitLoad.id_oper IN (:...operationsIds)', { operationsIds })
    .getRawMany();
  // лоады
  const loads = loadsData.map(row => {
    const oper = operationsData.find(row1 => row1.oper_id === row.unitLoad_id_oper)
    const unit = {
      id: row.unit_id,
      idc: row.unit_idc,
      title: row.unit_title,
      code: row.unit_code,
      retool: row.unit_retool,
      belong: row.unit_belong as UnitBelongEnum,
      type: row.unit_type as UnitTypeEnum,
      coment: row.unit_coment,
      active: row.unit_active,
    } as UnitItem

    return {
      id: row.unitLoad_id,
      idc: row.unitLoad_idc,
      unit: unit,
      // date: new Date(row.unitLoad_date).toLocaleDateString('en-CA'),
      date: YYYYMMDD(row.unitLoad_date),
      idc_oper: row.unitLoad_idc_oper,
      id_oper: row.unitLoad_id_oper,
      id_tCard: row.unitLoad_id_tCard,
      timeStart: row.unitLoad_timeStart, // здесь в минутах
      timeFinish: row.unitLoad_timeFinish,
      status: row.unitLoad_status,
      isActive: row.unitLoad_isActive,
      isRetool: row.unitLoad_isRetool,
      isPinned: row.unitLoad_isPinned,
      isOuterStart: row.unitLoad_isOuterStart,
      isOuterFinish: row.unitLoad_isOuterFinish,
      version: row.unitLoad_version,
      isFirst: row.unitLoad_isFirst,
      // частично заполняем инфо по карте
      loadInfo: {
        tCardIdc: row.tCard_idc,
        // tCardDate: new Date(row.tCard_date).toLocaleDateString("en-CA"),
        tCardDate: YYYYMMDD(row.tCard_date),
        title: oper.action_title,
        duration: oper.oper_duration,
        interruptible: oper.action_interruptible,
        koef: 1
      },

    }
  })

  // функции вычисления сроков  
  // на вход получаю дату и время окончания и выдаю позднее
  interface ReadyTerm {
    date: string; // Формат: "YYYY-MM-DD"
    time: number; // Время в минутах от начала дня
  }
  // function getLatestFinish(loads: { date: Date, time: number }[]): ReadyTerm {
  function getLatestFinish(loads: { date: string, time: number }[]): ReadyTerm {
    if (loads.length === 0) return { date: "", time: 0 };
    const latestLoad = loads.reduce((latest, current) => {
      // Сначала сравниваем дату (так как формат "YYYY-MM-DD" корректно сравнивается как строки)
      if (current.date > latest.date) {
        return current;
      } else if (current.date === latest.date && current.time > latest.time) {
        return current;
      }
      return latest;
    }, loads[0]);
    // return { date: new Date(latestLoad.date).toLocaleDateString('en-CA'), time: latestLoad.time };
    return { date: YYYYMMDD(latestLoad.date), time: latestLoad.time };
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

    const cardOperationsData = operationsData.filter(row => row.oper_tcard_id === card.id);
    const tCardOperations = [] as TCardOperationTermsItem[];
    // формируем массив операций по карте
    for (const row of cardOperationsData) {
      // Отбираем все загрузки для данной операции
      const loadsForOper = loadsData
        .filter(row1 => row1.unitLoad_id_oper === row.oper_id && !row1.unitLoad_isRetool)
        .map(row => { return { date: row.unitLoad_date, time: row.unitLoad_timeFinish } });
      // Находим загрузку с максимально поздним временем завершения - это дата исполнения операции
      const latestTerm: ReadyTerm = getLatestFinish(loadsForOper);

      // обновляем срок готовности карты
      cardTerm = getLaterDateTime(cardTerm, latestTerm);
      const stage = { id: row.stage_id, idc: row.stage_idc, code: row.stage_code, } as TCardStageItem
      const action = {
        id: row.action_id, title: row.action_title, code: row.action_code,
        modified: row.action_modified, interruptible: row.action_interruptible
      } as ActionItem

      tCardOperations.push({
        id: row.oper_id,
        idc: row.oper_idc,
        stage: stage,
        order: row.oper_order,
        out: [] as TCardProductItem[],
        inn: [] as TCardProductItem[],
        action: action as ActionItem,
        duration: row.oper_duration,
        mode: false,
        status: row.oper_status as StatusEnum,
        coment: row.oper_coment,
        readyTerm: latestTerm,
        expand: false,
        fixOperIdc: row.oper_fix_oper_idc,
      } as TCardOperationTermsItem);
    }


    tCardTerms.push({
      id: card.id,
      // date: new Date(card.date).toLocaleDateString("en-CA"),
      date: YYYYMMDD(card.date),
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

  return { tCardsTerms: tCardTerms, loads: loads };
}
// &&&&
// исключения расписания команды
export async function getExceptions(
  userId: number,
  locale: string,
  teamId: number,
  unitExceptionsRepository: Repository<UnitExceptionTable>,
  unitId?: number
): Promise<UnitExceptionItem[]> {

  const receivedExceptions = await unitExceptionsRepository.find({
    where: {
      team_id: teamId,
      ...(unitId ? { unit_id: unitId } : {})
    }
  });

  if (!receivedExceptions) return [] as UnitExceptionItem[]

  const excertions = receivedExceptions
    .map(exception => {

      return {
        id: exception.id,
        idc: exception.idc,
        unitId: exception.unit_id,
        unitIdc: exception.unit_idc,
        // date: new Date(exception.date).toLocaleDateString('en-CA'),
        date: YYYYMMDD(exception.date),
        type: exception.type as TimeTypeEnum,
        timeStart: exception.timeStart,
        timeFinish: exception.timeFinish,

      } as UnitExceptionItem;
    });

  return excertions;
}

// &&&&  ??
// возможные операции юнита
export async function getUnitActions(
  userId: number,
  locale: string,
  teamId: number,
  unitActionsRepository: Repository<UnitActionTable>,
  unitId?: number
): Promise<UnitActionItem[]> {

  const receivedUnitActions = await unitActionsRepository
    .createQueryBuilder('ua')
    .leftJoin('units', 'unit', 'ua.unit_id = unit.id')
    .leftJoin('actions', 'action', 'ua.action_id = action.id')
    .addSelect([
      'unit.id', 'unit.idc',
      'action.id', 'action.title', 'action.code', 'action.interruptible'
    ])
    .where('ua.team_id = :teamId', { teamId })
    .andWhere(unitId ? 'ua.unit_id = :unitId' : '1=1', { unitId }) // условие безопасное
    .getRawMany();

  if (!receivedUnitActions) return [] as UnitActionItem[]

  const unitActions = receivedUnitActions
    .map(ac => {
      const action = {
        id: ac.action_id,
        title: ac.action_title,
        code: ac.action_code,
        modified: false,
        interruptible: ac.action_interruptible,
      } as ActionItem

      return {
        id: ac.ua_id,
        idc: ac.ua_idc,
        action: action,
        koef: ac.ua_koef,
        unitId: ac.unit_id,
        unitIdc: ac.unit_idc,
      } as UnitActionItem;
    });

  return unitActions;
}

// &&&&
// расписание команды
export async function getTeamShedule(
  userId: number,
  locale: string,
  teamId: number,
  teamScheduleRepository: Repository<TeamScheduleTable>,
  teamsRepository: Repository<TeamTable>
): Promise<ScheduleItem> {

  const scheduleTable = await teamScheduleRepository.findOne({ where: { team_id: teamId } });

  if (!scheduleTable) return {} as ScheduleItem;

  return {
    teamId: scheduleTable.team_id,
    timeStartWork: scheduleTable.timeStartWork,
    timeFinishWork: scheduleTable.timeFinishWork,
    breaks: scheduleTable.breaks ?? [],
    holidays: (scheduleTable.holidays ?? []),
    weekends: scheduleTable.weekends ?? [],
    workdays: (scheduleTable.workdays ?? []).map(wd => ({
      date: YYYYMMDD(wd.date),
      timeStart: wd.timeStart,
      timeFinish: wd.timeFinish,
    })),
    timeZone: scheduleTable.timeZone as TimeZoneEnum,
  };
}

// расписание команд
export async function getTeamsShedule(
  userId: number | null,
  locale: string,
  teams: TeamItem[],
  teamScheduleRepository: Repository<TeamScheduleTable>,

): Promise<ScheduleItem[]> {

  const teamIds = teams.map(team => team.id)

  if (!teamIds || teamIds.length === 0) return [];
  const scheduleTables = await teamScheduleRepository.find({
    where: { team_id: In([...new Set(teamIds)]) },
  });

  const schedules = scheduleTables.map(scheduleTable => {

    return {
      teamId: scheduleTable.team_id,
      timeStartWork: scheduleTable.timeStartWork,
      timeFinishWork: scheduleTable.timeFinishWork,
      breaks: scheduleTable.breaks ?? [],
      holidays: (scheduleTable.holidays ?? []),
      weekends: scheduleTable.weekends ?? [],
      workdays: (scheduleTable.workdays ?? []).map(wd => ({
        date: YYYYMMDD(wd.date),
        timeStart: wd.timeStart,
        timeFinish: wd.timeFinish,
      })),
      timeZone: scheduleTable.timeZone as TimeZoneEnum,
    };
  })
  return schedules;
}


// &&&&&
// настройки команды
export async function getSettings(
  userId: number,
  locale: string,
  teamId: number,
  settingsRepository: Repository<SettingsTable>
): Promise<SettingsItem> {
  const settingsTable = await settingsRepository.findOne({ where: { team_id: teamId } });

  return {
    timeStartWork: settingsTable?.timeStartWork ?? 540,
    timeFinishWork: settingsTable?.timeFinishWork ?? 1080,
    showHoliday: settingsTable?.showHoliday ?? false,
    showWeekend: settingsTable?.showWeekend ?? false,
    isQualControl: settingsTable?.isQualControl ?? true,
  };
}

//  ПОЛУЧЕНИЕ ОПЕРАЦИИ ПО ID
export async function getTCardOperation(
  userId: number,
  locale: string,
  operId: number,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem | undefined> {
  // Строим фильтр для поиска по id карты
  const filter: Partial<TCardOperationTable> = {};

  if (operId) {
    filter.id = operId;
  }

  const tCardOpertab = await tCardOperationsRepository
    .createQueryBuilder('oper')
    .leftJoin('t_card_stages', 'stage', 'oper.stage_id = stage.id')
    .leftJoin('actions', 'action', 'oper.action_id = action.id')
    .addSelect([
      'stage.id', 'stage.code', 'stage.idc',
      'action.id', 'action.title', 'action.code', 'action.interruptible'
    ])
    .where('oper.id = :id', { id: filter.id }) // или другой фильтр по необходимости
    .getRawOne();

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

// &&&&&
// получение операций по ID ОПЕРАЦИЙ
export async function getTCardOperations(
  userId: number,
  locale: string,
  operIds: number[],
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem[]> {

  if (operIds.length === 0) return [];

  const tCardOperstab = await tCardOperationsRepository
    .createQueryBuilder('oper')
    .leftJoin('t_card_stages', 'stage', 'oper.stage_id = stage.id')
    .leftJoin('actions', 'action', 'oper.action_id = action.id')
    .leftJoin('t_cards', 'tcard', 'oper.tcard_id = tcard.id')
    .addSelect([
      'oper.id', 'oper.idc', 'oper.order', 'oper.duration', 'oper.status', 'oper.coment',
      'stage.id', 'stage.code', 'stage.idc',
      'action.id', 'action.title', 'action.code', 'action.interruptible',
      'tcard.id', 'tcard.idc', 'tcard.date'
    ])
    .where('oper.id IN (:...ids)', { ids: operIds })
    .getRawMany();

  return tCardOperstab.map(row => ({
    id: row.oper_id,
    idc: row.oper_idc,
    stage: {
      id: row.stage_id,
      idc: row.stage_idc,
      code: row.stage_code
    } as TCardStageItem,
    order: row.oper_order,
    out: [],
    inn: [],
    action: {
      id: row.action_id,
      title: row.action_title,
      code: row.action_code,
      interruptible: row.action_interruptible,
    } as ActionItem,
    duration: row.oper_duration,
    status: row.oper_status,
    coment: row.oper_coment,
  } as TCardOperationItem));
}

// получение операций по ID карт
export async function getTCardOperationsByCardId(
  userId: number,
  locale: string,
  tCardId: number,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem[]> {

  const tCardOperstab = await tCardOperationsRepository
    .createQueryBuilder('oper')
    .leftJoin('t_card_stages', 'stage', 'oper.stage_id = stage.id')
    .leftJoin('actions', 'action', 'oper.action_id = action.id')
    .leftJoin('t_cards', 'tcard', 'oper.tcard_id = tcard.id')
    .addSelect([
      'stage.id', 'stage.code', 'stage.idc',
      'action.id', 'action.title', 'action.code', 'action.interruptible',
      'tcard.id', 'tcard.idc', 'tcard.date'
    ])
    .where('oper.tcard_id = :tCardId', { tCardId })
    .getRawMany();

  const tCardOpers = tCardOperstab.map(tOper => {
    return {
      id: tOper.oper_id,
      idc: tOper.oper_idc,
      stage: {
        id: tOper.stage_id,
        idc: tOper.stage_idc,
        code: tOper.stage_code,
      } as TCardStageItem,
      order: tOper.oper_order,
      out: [],
      inn: [],
      action: {
        id: tOper.action_id,
        title: tOper.action_title,
        code: tOper.action_code,
        interruptible: tOper.action_interruptible,
      } as ActionItem,
      duration: tOper.oper_duration,
      status: tOper.oper_status,
      coment: tOper.oper_coment,
      fixOperIdc: tOper.oper_fix_oper_idc,
    } as TCardOperationItem
  });
  return tCardOpers;
}
// получение юнитов пользователей команды
export async function getUsersUnits(
  userId: number,
  locale: string,
  teamId: number,
  withoutAdmin: boolean,
  usersRepository: Repository<UserTable>,
  usersUnitsRepository: Repository<UserUnitTable>,
  userIdforUnit?: number, // Добавляем необязательный параметр userId
): Promise<{ success: boolean, userUnits: UserUnitItem[], message: string }> {

  try {

    // Шаг 1: Получаем юзеров 
    const userCondition: FindOptionsWhere<UserTable> = {
      team_id: teamId,
      active: true
    };
    if (userIdforUnit) { userCondition.id = userIdforUnit; }
    if (withoutAdmin) { userCondition.isAdmin = false; }

    const activeUsers = await usersRepository.find({ where: userCondition });


    // Если активные пользователи не найдены
    if (activeUsers.length === 0) {
      return {
        success: false,
        userUnits: [],
        message: 'Нет пользователей команды.',
      };
    }
    // Шаг 2: Получаем юзеров с юнитами 
    const usersUnits = await usersUnitsRepository
      .createQueryBuilder('uu')
      .leftJoin('users', 'user', 'uu.user_id = user.id')
      .leftJoin('units', 'unit', 'uu.unit_id = unit.id')
      .addSelect([
        'user.id', 'user.name', 'user.login', // добавь нужные поля
        'unit.id', 'unit.title', 'unit.code', 'unit.retool', 'unit.belong', 'unit.type', 'unit.coment', "unit.active",
      ])
      .where('uu.team_id = :teamId', { teamId })
      .getRawMany();


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
          id: userUnit.uu_id,
          userId: userUnit.user_id,
          name: userUnit.user_name,
          unit: {
            id: userUnit.unit_id,              // ID юнита
            title: userUnit.unit_title,        // Название юнита
            code: userUnit.unit_code,           // Код юнита (если есть)
            retool: userUnit.unit_retool,      // Время на переналадку
            belong: userUnit.unit_belong,      // Принадлежность юнита (enum)
            type: userUnit.unit_type,          // Тип юнита (enum)
            coment: userUnit.unit_coment,      // Комментарий юнита (если есть)
            active: userUnit.unit_active,        // Статус активности
          } as UnitItem,
          active: userUnit.uu_active,
        } as UserUnitItem;
    })
    return {
      success: true,
      userUnits: userUnits,
      message: 'Данные успешно получены.',
    };


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
  userId: number,
  locale: string,
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

// банер
export async function getBaner(
  userId: number,
  locale: string,
  teamId: number | undefined,
  banerRepository: Repository<BanerTable>
): Promise<BanerItem[]> {
  const currentDate = YYYYMMDD();
  // const currentDate = new Date().toLocaleDateString("en-CA"); // Получаем текущую дату в формате "YYYY-MM-DD"

  // собираем условия динамически
  const where: any = {
    date_to: MoreThanOrEqual(currentDate),
    date_from: LessThanOrEqual(currentDate),
    ...(teamId !== undefined ? { team_id: teamId } : {}),
  };

  const receivedBaner = await banerRepository.find({ where });

  const baner = receivedBaner.map(ban => ({
    message: ban.message,
    locale: ban.locale,
    // dateFrom: new Date(ban.date_from).toLocaleDateString("en-CA"),
    // dateTo: new Date(ban.date_to).toLocaleDateString("en-CA"),
    dateFrom: ban.date_from,
    dateTo: ban.date_to,
  }));

  return baner;
}

// счета
export async function getInvoices(
  userId: number,
  locale: string,
  teamId: number,
  invoicesRepository: Repository<InvoiceTable>
): Promise<InvoiceItem[]> {

  const receivedInvoices = await invoicesRepository.find({
    where: { team_id: teamId },
  });

  const invoices = receivedInvoices
    .map(invoice => {
      return {
        id: invoice.id,
        // date: invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('en-CA') : "",
        date: invoice.paid_at ? YYYYMMDD(invoice.paid_at) : "",
        invoice: `Invoice number ${invoice.stripe_invoice_number}`,
        link: invoice.invoice_pdf_url ?? ""
      } as InvoiceItem;
    });

  return invoices;
}


// тех поддержка получение
export async function getSuportMails(
  userId: number,
  locale: string,
  teamId: number | null,
  supportRepository: Repository<MailTable>
): Promise<SupportMailItem[]> {

  // Строим фильтр для поиска

  const filter: { team_id?: number; } = {};

  if (teamId) {
    filter.team_id = teamId;
  }

  // Выполняем запрос с фильтрацией
  const receivedSuportMessages = await supportRepository.find({
    where: filter,  // Применяем фильтр к запросу
  });


  const suportMessages = receivedSuportMessages
    .map(mes => {
      return {
        id: mes.id,
        // date: new Date(mes.date).toLocaleDateString('en-CA'),
        date: mes.date,
        title: mes.title,
        body: mes.body,
        userId: mes.user_id,
        fromUser: mes.fromUser,
        basedOn: mes.basedOn,
        teamId: mes.team_id,
        status: mes.status,
      };
    });

  return suportMessages;
}