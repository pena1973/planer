//handlers/handlers-get

import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual, FindManyOptions, FindOptionsWhere, Not } from 'typeorm';
import { ulogger } from "./../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

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

import { YYYYMMDD } from "@/lib/common/utils"

//! Общие коммерческие данные поставшика
export async function getMain(
  userId: number | null,
  locale: string,
  mainRepository: Repository<MainTable>,
  at: Date | string
): Promise<MainItem | undefined> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
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

      return undefined
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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getMain",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getMain(",
    }).catch(() => { console.error("logger error") });

    return undefined;
  }
}

//! Стоимость за день для команды
export async function getCostForDay(
  userId: number | null,
  locale: string,
  teamId: number,
  day: string,  // yyyy-mm-dd
  teamsRepository: Repository<TeamTable>,
  activeTimeRepository: Repository<ActiveTimeTable>,
  mainRepository: Repository<MainTable>,
): Promise<number | undefined> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
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
    const main = await getMain(userId, locale, mainRepository, day);
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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getCostForDay",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getCostForDay(",
    }).catch(() => { console.error("logger error") });

    return undefined
  }
}

//! баланс команды
export async function getBalance(
  userId: number | null,
  locale: string,
  date: Date | string,   // yyyy-mm-dd
  teamId: number,
  balanceRepository: Repository<BalanceTable>
): Promise<number|undefined> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getBalance",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getBalance(",
    }).catch(() => { console.error("logger error") });

    return undefined;
  }
}

//! баланс всех команды  для админа отключение если балансы <=0
export async function getBalances(
  userId: number,
  date: Date | string,
  balanceRepository: Repository<BalanceTable>,
  teamIds?: number[] // опционально: посчитать только для заданных команд
): Promise<{ teamId: number; balance: number }[]> {

  const t = getServerT("ru", 'translation'); // locale = 'ru' | 'en'

  try {
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

    if (rows.length === 0) {
      //  logger
      void ulogger.error({
        userId: userId,
        location: "handlers/handlers-get/getBalances",
        event: "error",
        message: `При запросе балансов команд к базе получаем 0 строк баланса запрос .createQueryBuilder('b')`,
        context: "export async function getBalances(",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getBalances",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getBalances(",
    }).catch(() => { console.error("logger error") });

    return [] as { teamId: number; balance: number }[];
  }
}

//! все команды
export async function getTeams(
  userId: number | null,
  locale: string,
  teamsRepository: Repository<TeamTable>
): Promise<TeamItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedTeams = await teamsRepository.find();

    if (receivedTeams.length === 0) {
      //  logger
      void ulogger.error({
        userId: userId,
        location: "handlers/handlers-get/getTeams",
        event: "error",
        message: `нет команд что быть не может: await teamsRepository.find()`,
        context: "const receivedTeams = await teamsRepository.find()",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTeams",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTeams(",
    }).catch(() => { console.error("logger error") });

    return [] as TeamItem[];
  }
}

//! состояние активности команд
export async function getTeamActivity(
  userId: number | null,
  locale: string,
  teams: TeamItem[],
  activeTimeRepository: Repository<ActiveTimeTable>
): Promise<{ teamId: number; active: boolean }[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {

    const teamIds = teams.map(t => t.id);
    const today = YYYYMMDD();

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

    if (rows.length === 0) {
      //  logger
      void ulogger.error({
        userId: userId,
        location: "handlers/handlers-get/getTeamActivity",
        event: "error",
        message: `При запросе событий команд к базе получаем 0 строк team_id: In(${teamIds}), date: LessThanOrEqual(${today})`,
        context: "export async function getTeamActivity(",
      }).catch(() => { console.error("logger error") });
    }

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

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTeamActivity",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTeamActivity(",
    }).catch(() => { console.error("logger error") });

    return [] as { teamId: number; active: boolean }[];
  }
}

//! все команды по группе на основании главной
export async function getTeamsByMainteamNumber(
  userId: number | null,
  locale: string,
  main_team: string,
  teamsRepository: Repository<TeamTable>
): Promise<TeamItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedAttachedTeams = await teamsRepository.find({
      where: { main_team: main_team },
    });

    if (receivedAttachedTeams.length === 0) {
      //  logger
      void ulogger.error({
        userId: userId,
        location: "handlers/handlers-get/getTeamsByMainteamNumber",
        event: "error",
        message: `При запросе команд группы по номеру основной команды к базе получаем 0 строк main_team: ${main_team}`,
        context: "export async function getTeamsByMainteamNumber(",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTeamsByMainteamNumber",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTeamsByMainteamNumber(",
    }).catch(() => { console.error("logger error") });

    return [] as TeamItem[];
  }
}

//! получить реквизиты инвойса клиента по id команды
export async function getClient(
  userId: number,
  locale: string,
  teamId: number,
  clientRepository: Repository<ClientTable>
): Promise<ClientItem | undefined> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedClient = await clientRepository.findOne({
      where: { team_id: teamId },
    });

    if (!receivedClient) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getClient",
        event: "error",
        message: `При запросе данных клиента - они не найдены team_id: ${teamId}`,
        context: "export async function getClient(",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getClient",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getClient(",
    }).catch(() => { console.error("logger error") });

    return undefined;
  }
}

//! получить реквизиты инвойсов всех клиентов 
export async function getClients(
  userId: number,
  locale: string,
  clientRepository: Repository<ClientTable>
): Promise<ClientItem[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedClients = await clientRepository.find();

    if (receivedClients.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getClients",
        event: "error",
        message: `При запросе данных всех клиентов  - они не найдены`,
        context: "export async function getClients(",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getClients",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getClients(",
    }).catch(() => { console.error("logger error") });

    return [] as ClientItem[];
  }
}

//! получить единицы измерения команды 
export async function getUOMs(
  userId: number,
  locale: string,
  teamId: number,
  uomsRepository: Repository<UOMsTable>
): Promise<UOMItem[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedUOMS = await uomsRepository.find({
      where: { team_id: teamId },
    });

    if (receivedUOMS.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUOMs",
        event: "warn",
        message: `При запросе данных единиц измерений команды  - они не найдены team_id: ${teamId}`,
        context: "export async function getUOMs(",
      }).catch(() => { console.error("logger error") });
    }

    const uoms = receivedUOMS
      .map(uom => {
        return {
          id: uom.id,
          code: uom.code,
          title: uom.title,
        } as UOMItem;
      });
    return uoms;
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getUOMs",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getUOMs(",
    }).catch(() => { console.error("logger error") });

    return [] as UOMItem[];
  }
}

//!  операции команды
export async function getActions(
  userId: number,
  locale: string,
  teamId: number,
  actionsRepository: Repository<ActionTable>
): Promise<ActionItem[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    // Выполняем запрос с фильтрацией
    const receivedActions = await actionsRepository.find({
      where: { team_id: teamId },
    });

    if (receivedActions.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getActions",
        event: "error",
        message: `При запросе данных действий команды  - они не найдены team_id: ${teamId}`,
        context: "export async function getActions(",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getActions",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getActions(",
    }).catch(() => { console.error("logger error") });

    return [] as ActionItem[];
  }
}

//! возможные операции юнита
export async function getUnitActions(
  userId: number,
  locale: string,
  teamId: number,
  unitActionsRepository: Repository<UnitActionTable>,
  unitId?: number
): Promise<UnitActionItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedUnitActions = await unitActionsRepository
      .createQueryBuilder('ua')
      .leftJoin('units', 'unit', 'ua.unit_id = unit.id')
      .leftJoin('actions', 'action', 'ua.action_id = action.id')
      .addSelect([
        'unit.id', 'unit.idc',
        'action.id', 'action.title', 'action.code', 'action.interruptible'
      ])
      .where('ua.team_id = :teamId', { teamId })
      .andWhere(unitId ? 'ua.unit_id = :unitId' : '1=1', { unitId })
      .getRawMany();

    if (receivedUnitActions.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUnitActions",
        event: "warn",
        message: `При запросе действий юнита (или по всем юнитам команды)  - они не найдены team_id: ${teamId}, unitId: ${unitId}`,
        context: "export async function getUnitActions(",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getUnitActions",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getUnitActions(",
    }).catch(() => { console.error("logger error") });

    return [] as UnitActionItem[];
  }
}

//! юниты
export async function getUnits(
  userId: number,
  locale: string,
  teamId: number,
  unitRepository: Repository<UnitTable>,
  unitId?: number,
): Promise<UnitItem[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedUnits = await unitRepository.find({
      where: { team_id: teamId, ...(unitId && { id: unitId }) },
    });

    if (receivedUnits.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUnits",
        event: "warn",
        message: `При запросе юнитов команды  - они не найдены team_id: ${teamId}`,
        context: "export async function getUnits(",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getUnits",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getUnits(",
    }).catch(() => { console.error("logger error") });

    return [] as UnitItem[];
  }
}

//! шаблоны карт
export async function getTemplates(
  userId: number,
  locale: string,
  teamId: number,
  templatesRepository: Repository<TemplateTable>
): Promise<TemplateItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedTemplates = await templatesRepository.find({
      where: { team_id: teamId },
    });

    if (receivedTemplates.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTemplates",
        event: "warn",
        message: `При запросе шаблонов команды  - они не найдены team_id: ${teamId}`,
        context: "export async function getTemplates(",
      }).catch(() => { console.error("logger error") });
    }

    const templates = receivedTemplates
      .map(template => {
        return {
          id: template.id,
          name: template.name,
          fileContent: template.fileContent,
        } as TemplateItem;
      });
    return templates;

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTemplates",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTemplates(",
    }).catch(() => { console.error("logger error") });

    return [] as TemplateItem[];
  }
}

//! Статусы лоадов
export async function getLoadStatuses(
  userId: number,
  locale: string,
  teamId: number,
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<{ idc_load: number, status: StatusEnum }[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedStatuses = await unitLoadRepository
      .createQueryBuilder('unitLoad')
      .select('unitLoad.idc', 'idc_load')  // поле + алиас
      .addSelect('unitLoad.status', 'status')   // поле + алиас
      .where('unitLoad.team_id = :teamId', { teamId })
      .getRawMany<{ idc_load: number; status: StatusEnum }>();

    if (receivedStatuses.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getLoadStatuses",
        event: "warn",
        message: `При запросе статусов лоадов команды  - они не найдены team_id: ${teamId}`,
        context: "export async function getLoadStatuses(",
      }).catch(() => { console.error("logger error") });
    }
    return receivedStatuses;
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getLoadStatuses",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getLoadStatuses(",
    }).catch(() => { console.error("logger error") });

    return [] as { idc_load: number, status: StatusEnum }[];
  }
}

//! Лоады юнитов
export async function getUnitLoads(
  userId: number,
  locale: string,
  teamId: number,
  units: UnitItem[],
  unitLoadRepository: Repository<UnitLoadTable>,
  unitActionsRepository: Repository<UnitActionTable>,
  isControler: boolean = false,
): Promise<UnitLoadItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    if (units.length === 0) {

      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUnitLoads",
        event: "warn",
        message: `При запросе лоадов не указано по каким юнитам (units=[]) team_id: ${teamId}`,
        context: "export async function getUnitLoads(",
      }).catch(() => { console.error("logger error") });
    }

    const unitIds = units.map(unit => unit.id);
    if (unitIds.length === 0) return [];

    // по всем юнитам команды
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

    if (unitLoads.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUnitLoads",
        event: "warn",
        message: `При запросе лоадов команды по юнитам - они не найдены  team_id: ${teamId}, IN (:...unitIds)', { unitIds }, isControler: ${isControler}`,
        context: "const unitLoads = await query.getRawMany()",
      }).catch(() => { console.error("logger error") });
    }

    const unitLoadItems: UnitLoadItem[] = unitLoads.map(row => {
      const unit = units.find(unit => unit.id === row.unitLoad_unit_id);
      const unitAction = unitActions.find(uAct => uAct.unitId === row.unitLoad_unit_id && uAct?.action.id === row.tOper_action_id);
      return {
        id: row.unitLoad_id,
        idc: row.unitLoad_idc,
        unit: unit ?? {} as UnitItem,
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
          tCardDate: YYYYMMDD(row.tCard_date),
          title: unitAction?.action.title ?? "",
          duration: row.tOper_duration,
          interruptible: unitAction?.action.interruptible ?? false,
          koef: unitAction?.koef ?? 1.00,
        },
      } as UnitLoadItem;
    });

    return unitLoadItems;
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getUnitLoads",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getUnitLoads(",
    }).catch(() => { console.error("logger error") });

    return [] as UnitLoadItem[];
  }
}

//! id лоадов по операции с определенной версией
export async function getTCardOperationLoads(
  userId: number,
  locale: string,
  tCardId: number, // ID карты для фильтрации
  operId: number, // ID операции для фильтрации
  version: number, // Версия для фильтрации
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<number[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    // Получаем операции с фильтрацией по tCardId, operId и version
    const unitLoads = await unitLoadRepository.createQueryBuilder('unitLoad')
      .where('unitLoad.id_tCard = :tCardId', { tCardId })
      .andWhere('unitLoad.id_oper = :operId', { operId })
      .andWhere('unitLoad.version = :version', { version })
      .getMany();

    if (unitLoads.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardOperationLoads",
        event: "warn",
        message: `При запросе лоадов операции определенной версии - они не найдены  id_tCard: ${tCardId}, id_oper: ${operId}, version: ${version}`,
        context: " const unitLoads = await unitLoadRepository.createQueryBuilder('unitLoad')",
      }).catch(() => { console.error("logger error") });
    }

    const loadsIds = unitLoads.map(lo => lo.id)

    return loadsIds;
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTCardOperationLoads",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCardOperationLoads(",
    }).catch(() => { console.error("logger error") });

    return [] as number[];
  }
}

//! ВСЕ лоады по КАРТЕ (ДЛЯ ПРОВЕРКИ возможности удаления карты целиком)
export async function getTCardLoadsToCheckforDelete(
  userId: number,
  locale: string,
  tCard: TCardItem,
  units: UnitItem[],
  unitLoadRepository: Repository<UnitLoadTable>,
): Promise<UnitLoadItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
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

    if (unitLoads.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardLoads",
        event: "warn",
        message: `При запросе лоадов карты - они не найдены  id_tCard: ${tCard.id}`,
        context: "export async function getTCardLoads(",
      }).catch(() => { console.error("logger error") });
    }

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
          tCardDate: YYYYMMDD(tCard.date),
          title: operation?.action.title ?? '',
          duration: operation?.duration ?? 0,
          interruptible: operation?.action.interruptible ?? false,
          koef: 1   //  это неважно  при проверке возможности удаления карты
        }
      } as UnitLoadItem;
    });

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTCardLoadsToCheckforDelete",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCardLoadsToCheckforDelete(",
    }).catch(() => { console.error("logger error") });

    return [] as UnitLoadItem[];
  }
}

//! список карт только шапка
export async function getTCards(
  userId: number,
  locale: string,
  teamId: number,
  statuses: StatusEnum[],
  tCardRepository: Repository<TCardTable>
): Promise<TCardItem[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const tCards = await tCardRepository.find({
      where: { team_id: teamId, status: In(statuses) },
      select: ['id', 'date', 'idc', 'coment', 'status', 'max_idc'],
    });

    if (tCards.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCards",
        event: "warn",
        message: `При запросе списка карт только шапка - они не найдены  team_id: ${teamId}, status: In(${statuses})`,
        context: "export async function getTCards(",
      }).catch(() => { console.error("logger error") });
    }

    return (tCards || []).map(t => ({
      id: t.id,
      date: YYYYMMDD(t.date),
      idc: t.idc || 1,
      modified: false,
      maxIdc: t.max_idc,
      coment: t.coment,
      status: t.status
    }));
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTCards",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCards(",
    }).catch(() => { console.error("logger error") });

    return [] as TCardItem[];
  }
}

//! КАРТА! только шапка
export async function getTCard(
  userId: number,
  locale: string,
  tcardId: number,
  tCardRepository: Repository<TCardTable>
): Promise<TCardItem | undefined> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {

    if (!tcardId) {
      return undefined;
    }
    const tCardtab = await tCardRepository.findOne({
      where: { id: tcardId },
    });

    if (!tCardtab) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCard",
        event: "warn",
        message: `При запросе карты -она не найдена  id: ${tcardId}`,
        context: "export async function getTCard(",
      }).catch(() => { console.error("logger error") });
    }

    // Проверяем, что карта существует
    if (!tCardtab) return undefined;

    // Преобразуем карты    
    return {
      id: tCardtab.id,
      date: YYYYMMDD(tCardtab.date),
      idc: tCardtab.idc || 1,  // Если number не заполнен, возвращаем "1"
      modified: false,
      maxIdc: tCardtab.max_idc,
      coment: tCardtab.coment,
      status: tCardtab.status
    };
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTCard",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCard(",
    }).catch(() => { console.error("logger error") });

    return undefined;
  }
}

//!Стадии карты
export async function getStages(
  userId: number,
  locale: string,
  tcardId: number,
  tCardStageRepository: Repository<TCardStageTable>,
): Promise<TCardStageItem[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const tCardStagestab = await tCardStageRepository.find({
      where: { tcard_id: tcardId }
    });
    if (tCardStagestab.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getStages",
        event: "warn",
        message: `При запросе стадий карты  - они не найдены tcard_id: ${tcardId}`,
        context: "export async function getStages(",
      }).catch(() => { console.error("logger error") });
    }
    // Преобразуем стадии
    const tCardStages_ = tCardStagestab
      .map(stage => {
        return {
          id: stage.id,
          idc: stage.idc,
          code: stage.code,
        } as TCardStageItem;
      });

    return tCardStages_;
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getStages",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getStages(",
    }).catch(() => { console.error("logger error") });

    return [] as TCardStageItem[];
  }
}

//! Каталог продуктов карты 
export async function getProductsCatalog(
  userId: number,
  locale: string,
  tcardId: number,
  productRepository: Repository<ProductTable>,
): Promise<ProductItem[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
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

    if (productstab.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getProductsCatalog",
        event: "warn",
        message: `При запросе каталога продуктов карты  - они не найдены tcard_id: ${tcardId}`,
        context: "export async function getProductsCatalog(",
      }).catch(() => { console.error("logger error") });
    }

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


    return products_;
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getProductsCatalog",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getProductsCatalog(",
    }).catch(() => { console.error("logger error") });

    return [] as ProductItem[];
  }
}

//! КАРТА! Вместе с составными частями карты
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

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const tCardtab = tcardId ? await tCardRepository.findOne({ where: { id: tcardId } }) : null;

    if (!tCardtab) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardFull",
        event: "warn",
        message: `При запросе карты - она не найдена по id: ${tcardId}`,
        context: "export async function getTCardFull(",
      }).catch(() => { console.error("logger error") });
    }

    // Проверяем, что карта существует
    if (!tCardtab) return undefined;

    // ДЕЙСТВИЯ КОМАНДЫ
    const actions = await getActions(userId, locale, teamId, actionRepository);

    // СТАДИИ
    const tCardStages = await getStages(userId, locale, tcardId, tCardStageRepository);

    //  КАТАЛОГ Продуктов
    const products = await getProductsCatalog(userId, locale, tcardId, productRepository);

    // ПРОДУКТЫ, МАТЕРИАЛЫ, ОТХОДЫ
    const tCardProductstab = await tCardProductRepository.find({
      where: { tcard_id: tcardId },
    });

    // вспомогательная функция преобразования продукта
    const mapTCardProduct = (tProduct: TCardProductTable): TCardProductItem => {
      const product = products.find(p => p.id === tProduct.product_id);
      return {
        id: tProduct.id,
        code: tProduct.code,
        qtu: tProduct.qtu,
        product: product ?? {} as ProductItem
      } as TCardProductItem;
    };
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

    if (tCardOperationstab.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardFull",
        event: "warn",
        message: `При запросе операций карты  - они не найдены tcard_id: ${tcardId}`,
        context: "export async function getTCardFull(",
      }).catch(() => { console.error("logger error") });
    }

    // Преобразуем операции
    const tCardOperations_: TCardOperationItem[] = tCardOperationstab.map(raw => {
      const stage = tCardStages.find(s => s.id === raw.oper_stage_id);
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

    // Собираем карту целиком
    const tCard = {
      id: tCardtab.id,
      date: YYYYMMDD(tCardtab.date),
      idc: tCardtab.idc,
      products: products,
      tCardProducts: tCardProducts_,
      tCardWastes: tCardWastes_,
      tCardOperations: tCardOperations_,
      tCardMaterials: tCardMaterials_,
      tCardStages: tCardStages,
      maxIdc: tCardtab.max_idc,
      coment: tCardtab.coment,
      status: tCardtab.status,
      modified: false,

    } as TCardItem

    return tCard
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTCardFull",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCardFull(",
    }).catch(() => { console.error("logger error") });

    return undefined;
  }
}

//! запрос для отчета о состоянии готовности карты + операции + лоады
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
  showClosed: boolean
): Promise<{ tCardsTerms: TCardTermsItem[], loads: UnitLoadItem[] }> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {

    const where: FindOptionsWhere<TCardTable> = {
      team_id: teamId,
    };

    if (tCardIdc) {
      where.idc = tCardIdc;
    }

    const dateFrom = tCardDateFrom ? tCardDateFrom : undefined;
    const dateTo = tCardDateTo ? tCardDateTo : undefined;

    if (dateFrom && dateTo) {
      where.date = Between(dateFrom, dateTo);
    } else if (dateFrom) {
      where.date = MoreThanOrEqual(dateFrom);
    } else if (dateTo) {
      where.date = LessThanOrEqual(dateTo);
    }

    if (!showClosed) {
      where.status = Not(In([StatusEnum.closed, StatusEnum.cancelled]));
    }

    if (tCardStatus) {
      where.status = tCardStatus;
    }

    // Создаем объект фильтра для карты
    const tCardFilter: FindManyOptions<TCardTable> = { where, };

    // Получаем все карты для заданной компании с фильтрацией
    const tCards = await tCardRepository.find(tCardFilter);

    const tCardTerms: TCardTermsItem[] = []; // массив на выход

    // Если нет карт, возвращаем пустой результат
    if (tCards.length === 0) { return { tCardsTerms: [], loads: [] }; }

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

    if (operationsData.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardsTerms",
        event: "warn",
        message: `При запросе операций карт  - они не найдены tcard_id IN ${tCardsIds}`,
        context: "const operationsData = await tCardOperationRepository",
      }).catch(() => { console.error("logger error") });
    }

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

    if (loadsData.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardsTerms",
        event: "warn",
        message: `При запросе лоадов операций карт  - они не найдены id_oper IN ${operationsIds}`,
        context: "const loadsData = await unitLoadRepository",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTCardsTerms",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCardsTerms(",
    }).catch(() => { console.error("logger error") });

    return { tCardsTerms: [] as TCardTermsItem[], loads: [] as UnitLoadItem[] };
  }
}

//! исключения расписания юнитов команды (либо по всем юнитам, либо по конкретному юниту)
export async function getUnitExceptions(
  userId: number,
  locale: string,
  teamId: number,
  unitExceptionsRepository: Repository<UnitExceptionTable>,
  unitId?: number
): Promise<UnitExceptionItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedExceptions = await unitExceptionsRepository.find({
      where: {
        team_id: teamId, ...(unitId ? { unit_id: unitId } : {})
      }
    });

    if (receivedExceptions.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUnitExceptions",
        event: "warn",
        message: `При запросе отклонений расписания юнитов команды  - они не найдены team_id: ${teamId}, unit_id: ${unitId}`,
        context: "export async function getUnitExceptions(",
      }).catch(() => { console.error("logger error") });
    }
    const excertions = receivedExceptions
      .map(exception => {
        return {
          id: exception.id,
          idc: exception.idc,
          unitId: exception.unit_id,
          unitIdc: exception.unit_idc,
          date: YYYYMMDD(exception.date),
          type: exception.type as TimeTypeEnum,
          timeStart: exception.timeStart,
          timeFinish: exception.timeFinish,

        } as UnitExceptionItem;
      });

    return excertions;

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getUnitExceptions",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getUnitExceptions(",
    }).catch(() => { console.error("logger error") });

    return [] as UnitExceptionItem[];
  }
}

//! расписание команды
export async function getTeamShedule(
  userId: number,
  locale: string,
  teamId: number,
  teamScheduleRepository: Repository<TeamScheduleTable>,
): Promise<ScheduleItem | undefined> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const scheduleTable = await teamScheduleRepository.findOne({ where: { team_id: teamId } });

    if (!scheduleTable) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTeamShedule",
        event: "warn",
        message: `При запросе расписания команды - оно не найдено по team_id: ${teamId}`,
        context: "export async function getTeamShedule(",
      }).catch(() => { console.error("logger error") });
    }

    if (!scheduleTable) return undefined;

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTeamShedule",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTeamShedule(",
    }).catch(() => { console.error("logger error") });

    return undefined;
  }
}

//! расписание команд для получеиня таймзоны по командам
export async function getTeamsShedule(
  userId: number | null,
  locale: string,
  teams: TeamItem[],
  teamScheduleRepository: Repository<TeamScheduleTable>,

): Promise<ScheduleItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    if (teams.length === 0) return []; // нет команд - нет расписаний

    const teamIds = teams.map(team => team.id)

    if (!teamIds || teamIds.length === 0) return [];
    const scheduleTables = await teamScheduleRepository.find({
      where: { team_id: In([...new Set(teamIds)]) },
    });

    if (scheduleTables.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTeamsShedule",
        event: "warn",
        message: `При запросе расписания команд  - они не найдены team_id: In([...new Set(${teamIds})]`,
        context: "export async function getTeamsShedule(",
      }).catch(() => { console.error("logger error") });
    }

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

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getTeamsShedule",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTeamsShedule(",
    }).catch(() => { console.error("logger error") });

    return [] as ScheduleItem[];
  }
}

//! настройки команды
export async function getSettings(
  userId: number,
  locale: string,
  teamId: number,
  settingsRepository: Repository<SettingsTable>
): Promise<SettingsItem | undefined> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const settingsTable = await settingsRepository.findOne({ where: { team_id: teamId } });

    if (!settingsTable) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getSettings",
        event: "warn",
        message: `При запросе настроек команды  - они не найдены team_id: ${teamId}`,
        context: "export async function getSettings(",
      }).catch(() => { console.error("logger error") });
    }

    return {
      timeStartWork: settingsTable?.timeStartWork ?? 540,
      timeFinishWork: settingsTable?.timeFinishWork ?? 1080,
      showHoliday: settingsTable?.showHoliday ?? false,
      showWeekend: settingsTable?.showWeekend ?? false,
      isQualControl: settingsTable?.isQualControl ?? true,
    };
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getSettings",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getSettings(",
    }).catch(() => { console.error("logger error") });

  }
}

//!  ПОЛУЧЕНИЕ ОПЕРАЦИИ ПО ID
export async function getTCardOperation(
  userId: number,
  locale: string,
  operId: number,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem | undefined> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {

    const tCardOpertab = await tCardOperationsRepository
      .createQueryBuilder('oper')
      .leftJoin('t_card_stages', 'stage', 'oper.stage_id = stage.id')
      .leftJoin('actions', 'action', 'oper.action_id = action.id')
      .addSelect([
        'stage.id', 'stage.code', 'stage.idc',
        'action.id', 'action.title', 'action.code', 'action.interruptible'
      ])
      .where('oper.id = :id', { id: operId })
      .getRawOne();

    if (!tCardOpertab) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardOperation",
        event: "warn",
        message: `При запросе настроек команды  - они не найдены id: ${operId}`,
        context: "export async function getTCardOperation(",
      }).catch(() => { console.error("logger error") });
    }

    // Проверяем, что операция существует
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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/cards/getTCardOperation",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCardOperation(",
    }).catch(() => { console.error("logger error") });

    return undefined;
  }
}

//! получение операций по ID ОПЕРАЦИЙ
export async function getTCardOperations(
  userId: number,
  locale: string,
  operIds: number[],
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {

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


    if (tCardOperstab.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardOperations",
        event: "warn",
        message: `При запросе операций по картам  - они не найдены oper.id IN (:...ids)', { ids: ${operIds} }`,
        context: "export async function getTCardOperations(",
      }).catch(() => { console.error("logger error") });
    }

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

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/cards/getTCardOperations",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCardOperations(",
    }).catch(() => { console.error("logger error") });

    return [] as TCardOperationItem[];
  }
}

//! получение операций по ID карт
export async function getTCardOperationsByCardId(
  userId: number,
  locale: string,
  tCardId: number,
  tCardOperationsRepository: Repository<TCardOperationTable>
): Promise<TCardOperationItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
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


    if (tCardOperstab.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getTCardOperationsByCardId",
        event: "warn",
        message: `При запросе операций по id карты  - они не найдены 'oper.tcard_id = :tCardId', { ${tCardId} }`,
        context: "export async function getTCardOperationsByCardId(",
      }).catch(() => { console.error("logger error") });
    }

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
  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/cards/getTCardOperationsByCardId",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getTCardOperationsByCardId(",
    }).catch(() => { console.error("logger error") });

    return [] as TCardOperationItem[];
  }
}

//! получение пользователей команды c привязкой к юнитам
export async function getUsersUnits(
  userId: number,
  locale: string,
  teamId: number,
  withoutAdmin: boolean,
  usersRepository: Repository<UserTable>,
  usersUnitsRepository: Repository<UserUnitTable>,
  userIdforUnit?: number, // Добавляем необязательный параметр userId
): Promise<{ success: boolean, userUnits: UserUnitItem[], message: string }> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    // Шаг 1: Получаем юзеров 
    const filter: FindOptionsWhere<UserTable> = {
      team_id: teamId,
      active: true
    };

    if (userIdforUnit) { filter.id = userIdforUnit; }
    if (withoutAdmin) { filter.isAdmin = false; }

    const activeUsers = await usersRepository.find({ where: filter });

    if (activeUsers.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUsersUnits",
        event: "warn",
        message: `При запросе активных юзеров которые не админ команды - они не найдены 'team_id: ${teamId}, withoutAdmin: ${withoutAdmin}, userIdforUnit: ${userIdforUnit}`,
        context: "const activeUsers = await usersRepository.find({ where: filter })",
      }).catch(() => { console.error("logger error") });
    }
    if (activeUsers.length === 0) {
      return {
        success: false,
        userUnits: [],
        message: t('mes.noTeamUsers'),
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

    if (activeUsers.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUsersUnits",
        event: "warn",
        message: `При запросе юзеров которые привязаны к юнитам - они не найдены 'team_id: ${teamId}`,
        context: " const usersUnits = await usersUnitsRepository",
      }).catch(() => { console.error("logger error") });
    }

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
      message: t('mes.success'),
    };

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/cards/getUsersUnits",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getUsersUnits(",
    }).catch(() => { console.error("logger error") });
    return { success: false, userUnits: [], message };
  }
}

//! получение пользователей команды
export async function getUsers(
  userId: number,
  locale: string,
  teamId: number,
  usersRepository: Repository<UserTable>,
): Promise<{ success: boolean, users: UserItem[], message: string }> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'
  try {
    // Шаг 1: Получаем всех пользователей команды
    const users = await usersRepository.find({ where: { team_id: teamId, isAdmin: false } });

    if (users.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getUsers",
        event: "warn",
        message: `При запросе юзеров - они не найдены 'team_id: ${teamId}, isAdmin: false`,
        context: "export async function getUsers(",
      }).catch(() => { console.error("logger error") });
    }

    // Если активные пользователи не найдены
    if (users.length === 0) {
      return {
        success: false,
        users: [],
        message: t('mes.noUsers'),
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
      message: t('mes.success'),
    };


  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/cards/getUsers",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getUsers(",
    }).catch(() => { console.error("logger error") });
    return { success: false, users: [], message };
  }
}


//! банер
export async function getBaner(
  userId: number,
  locale: string,
  teamId: number | undefined,
  banerRepository: Repository<BanerTable>
): Promise<BanerItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const currentDate = YYYYMMDD();

    // собираем условия динамически
    const where: any = {
      date_to: MoreThanOrEqual(currentDate),
      date_from: LessThanOrEqual(currentDate),
      ...(teamId !== undefined ? { team_id: teamId } : {}),
    };

    const receivedBaner = await banerRepository.find({ where });

    if (receivedBaner.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getBaner",
        event: "warn",
        message: `При запросе банера - они не найдены 'team_id: ${teamId}`,
        context: "export async function getBaner(",
      }).catch(() => { console.error("logger error") });
    }

    const baner = receivedBaner.map(ban => ({
      message: ban.message,
      locale: ban.locale,
      dateFrom: ban.date_from,
      dateTo: ban.date_to,
    }));

    return baner;

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/cards/getBaner",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getBaner(",
    }).catch(() => { console.error("logger error") });

    return [] as BanerItem[];
  }
}

//!счета
export async function getInvoices(
  userId: number,
  locale: string,
  teamId: number,
  invoicesRepository: Repository<InvoiceTable>
): Promise<InvoiceItem[]> {
  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const receivedInvoices = await invoicesRepository.find({
      where: { team_id: teamId },
    });

    if (receivedInvoices.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getInvoices",
        event: "warn",
        message: `При запросе инвойсов - они не найдены 'team_id: ${teamId}`,
        context: "export async function getInvoices(",
      }).catch(() => { console.error("logger error") });
    }

    const invoices = receivedInvoices
      .map(invoice => {
        return {
          id: invoice.id,
          date: invoice.paid_at ? YYYYMMDD(invoice.paid_at) : "",
          invoice: `Invoice number ${invoice.stripe_invoice_number}`,
          link: invoice.invoice_pdf_url ?? ""
        } as InvoiceItem;
      });

    return invoices;

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "services/cards/getInvoices",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getInvoices(",
    }).catch(() => { console.error("logger error") });
    return [] as InvoiceItem[];
  }
}

//!тех поддержка получение
export async function getSuportMails(
  userId: number,
  locale: string,
  teamId: number | null,
  supportRepository: Repository<MailTable>
): Promise<SupportMailItem[]> {

  const t = getServerT(locale, 'translation'); // locale = 'ru' | 'en'

  try {
    const where = teamId != null ? { team_id: teamId } : {};

    const receivedSuportMessages = await supportRepository.find({ where });

    if (receivedSuportMessages.length === 0) {
      //  logger
      void ulogger.warn({
        userId: userId,
        location: "handlers/handlers-get/getSuportMails",
        event: "warn",
        message: `При запросе писем техподдержки - они не найдены 'team_id: ${teamId}`,
        context: "export async function getSuportMails(",
      }).catch(() => { console.error("logger error") });
    }

    const suportMessages = receivedSuportMessages
      .map(mes => {
        return {
          id: mes.id,
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

  } catch (e: unknown) {
    let message = t('mes.error');
    if (e instanceof Error) {
      message = `${t('mes.error')} ${e.message}`;
    }
    //  logger
    void ulogger.error({
      userId: userId,
      location: "handlers/handlers-get/getSuportMails",
      event: "basa_error",
      message: `catch: ${message}`,
      context: "export async function getSuportMails(",
    }).catch(() => { console.error("logger error") });

    return [] as SupportMailItem[];
  }
}