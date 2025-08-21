import { DataSource, Repository } from "typeorm";
import { TeamTable } from "./../models/catalogs/teams";
import { BillTable } from "./../models/billing/bills";
import { BillRowTable } from "./../models/billing/bill_row";
import { BalanceTable } from "./../models/billing/balance";

const BASE = Number(process.env.BILLING_BASE_PRICE ?? 100);
const DISC_PCT = Math.min(100, Math.max(0, Number(process.env.BILLING_SUBTEAM_DISCOUNT_PCT ?? 0)));
const CURRENCY = String(process.env.BILLING_CURRENCY ?? "EUR");

/** 1-е число текущего месяца (дата инвойса) */
function firstDayOfCurrentMonth(d = new Date()): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
/** Период оказания услуги: весь прошлый месяц */
function lastMonthPeriod(d = new Date()): { from: Date; to: Date } {
    const firstThis = firstDayOfCurrentMonth(d);
    const from = new Date(Date.UTC(firstThis.getUTCFullYear(), firstThis.getUTCMonth() - 1, 1));
    const to = new Date(Date.UTC(firstThis.getUTCFullYear(), firstThis.getUTCMonth(), 0)); // последний день прошлого
    return { from, to };
}
/** Извлечь id основной команды из строки main_team (префикс0000ID) */
function extractMainTeamId(mainCode: string): number | null {
    const m = mainCode.match(/(\d+)$/);
    return m ? Number(m[1]) : null;
}
function f2(n: number) {
    return n.toFixed(2);
}
function ymd(d: Date) {
    return d.toISOString().slice(0, 10);
}

export type BillingRunResult = {
    billedTeams: Array<{ mainTeamId: number; mainCode: string; rows: number; total: string; billId: number }>;
    skipped: Array<{ mainTeamId: number; reason: string }>;
};

/**
 * Единоразовый запуск биллинга.
 * Создаёт по одному инвойсу на каждую «основную» группу (ключ = main_team),
 * строки по каждой команде в группе, и расход в балансе на основную.
 * Идемпотентность: если на эту основную уже есть Bill с date = 1-е число текущего месяца — пропускаем.
 */
export async function runMonthlyBilling(ds: DataSource, runDate: Date = new Date()): Promise<BillingRunResult> {
    const teamRepo = ds.getRepository(TeamTable);
    const billRepo = ds.getRepository(BillTable);
    const rowRepo = ds.getRepository(BillRowTable);
    const balRepo = ds.getRepository(BalanceTable);

    const invoiceDate = firstDayOfCurrentMonth(runDate);
    const period = lastMonthPeriod(runDate);

    // Берём все активные команды и группируем по main_team
    const teams = await teamRepo.createQueryBuilder("t")
        .where("t.active = :a", { a: true })
        .getMany();

    const groups = new Map<string, TeamTable[]>();
    for (const t of teams) {
        if (!t.main_team) continue;
        const arr = groups.get(t.main_team) ?? [];
        arr.push(t);
        groups.set(t.main_team, arr);
    }

    const result: BillingRunResult = { billedTeams: [], skipped: [] };

    for (const [mainCode, groupTeams] of groups.entries()) {
        // Определяем основную команду по ID, зашитому в mainCode
        const mainTeamId = extractMainTeamId(mainCode);
        if (!mainTeamId) {
            result.skipped.push({ mainTeamId: -1, reason: `Не удалось извлечь id из '${mainCode}'` });
            continue;
        }
        const mainTeam = teams.find(t => t.id === mainTeamId);
        if (!mainTeam) {
            result.skipped.push({ mainTeamId, reason: "Основная команда не найдена среди активных" });
            continue;
        }

        // Идемпотентность: инвойс за этот месяц уже есть?
        const existing = await billRepo.createQueryBuilder("b")
            .where("b.team_id = :tid AND b.date = :d", { tid: mainTeamId, d: ymd(invoiceDate) })
            .getOne();
        if (existing) {
            result.skipped.push({ mainTeamId, reason: `Инвойс уже создан (id=${existing.id})` });
            continue;
        }

        // Считаем суммы
        const subteams = groupTeams.filter(t => t.id !== mainTeamId);
        const mainAmount = BASE;
        const subAmount = BASE * (1 - DISC_PCT / 100);
        const total = mainAmount + subteams.length * subAmount;

        // Транзакция на группу
        // eslint-disable-next-line no-await-in-loop
        await ds.transaction(async manager => {
            const bill = await manager.getRepository(BillTable).save({
                date: invoiceDate,
                title: `Invoice ${ymd(invoiceDate)}`,
                coment: `Ежемесячное списание за период ${ymd(period.from)}—${ymd(period.to)}`,
                paid: false,
                team_id: mainTeamId,
            });

            const rows: BillRowTable[] = [];

            // Строка по основной
            rows.push(
                manager.getRepository(BillRowTable).create({
                    bill: bill.id,
                    date_from: period.from,
                    date_to: period.to,
                    billable_team_id: String(mainTeam.id), // можно заменить на код, если нужно
                    discaunt: 0 as any,                    // колонка у вас varchar — сохранится как "0"
                    amount: f2(mainAmount),
                    carency: CURRENCY,
                    team_id: mainTeamId,                   // «id основной команды»
                })
            );

            // Строки по присоединённым
            for (const t of subteams) {
                rows.push(
                    manager.getRepository(BillRowTable).create({
                        bill: bill.id,
                        date_from: period.from,
                        date_to: period.to,
                        billable_team_id: String(t.id),
                        discaunt: DISC_PCT as any,
                        amount: f2(subAmount),
                        carency: CURRENCY,
                        team_id: mainTeamId,
                    })
                );
            }

            await manager.getRepository(BillRowTable).save(rows);
           
            // Проводка в баланс (расход = "-")
            await manager.getRepository(BalanceTable).save({
                date: invoiceDate,
                summa: parseFloat((-total).toFixed(2)), // <= число          // decimal ожидает string — toFixed это даёт
                direction: "-",
                document: `Invoice #${bill.id} от ${ymd(invoiceDate)}`,
                coment: `Ежемесячное списание за ${ymd(period.from)}—${ymd(period.to)}`,
                is_trial: false,
                team_id: mainTeamId,
            });

            result.billedTeams.push({
                mainTeamId,
                mainCode,
                rows: rows.length,
                total: f2(total),
                billId: bill.id,
            });
        });
    }

    return result;
}

/** Защитный ран: выполнять только если сегодня 1-е число (UTC). Возвращает null, если не время. */
export async function runIfFirstDay(ds: DataSource): Promise<BillingRunResult | null> {
    const now = new Date();
    if (now.getUTCDate() !== 1) return null;
    return runMonthlyBilling(ds, now);
}
