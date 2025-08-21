// services/billingService.ts
import { DataSource, In } from "typeorm";
import { BillTable } from "./../../db/models/billing/bills";
import { BillRowTable } from "./../../db/models/billing/bill_row";
import { TeamTable } from "./../../db/models/catalogs/teams";
import { BalanceTable } from "./../../db/models/billing/balance";

function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function firstDayOfMonth(year: number, month01: number) {
    // month01: 1..12
    return new Date(Date.UTC(year, month01 - 1, 1));
}
function lastMonthPeriod(invoiceDate: Date) {
    // период оказания услуг = предыдущий месяц относительно даты инвойса
    const from = new Date(Date.UTC(invoiceDate.getUTCFullYear(), invoiceDate.getUTCMonth() - 1, 1));
    const to = new Date(Date.UTC(invoiceDate.getUTCFullYear(), invoiceDate.getUTCMonth(), 0));
    return { from, to };
}
function parseMonth(month?: string): Date {
    // month формата 'YYYY-MM'; по умолчанию — текущий месяц
    if (month && /^\d{4}-\d{2}$/.test(month)) {
        const [y, m] = month.split("-").map(Number);
        return firstDayOfMonth(y, m);
    }
    const now = new Date();
    return firstDayOfMonth(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

export type MonthlySummary = {
    invoiceDate: string;                  // 'YYYY-MM-DD' (всегда 1-е)
    servicePeriod: { from: string; to: string };
    currency: string;
    invoices: Array<{
        billId: number;
        teamId: number;                     // основная команда
        teamTitle: string;
        date: string;                       // дата счета
        rowsCount: number;
        total: string;                      // 2 знака, как строка
        balanceEntry?: { id: number; summa: string; document: string } | null;
        rows: Array<{
            billableTeamId: string;           // id «за кого»
            billableTeamTitle: string;
            discountPct: string;              // как хранится в БД (varchar)
            amount: string;                   // как хранится в БД (varchar/decimal)
        }>;
    }>;
    totals: { invoices: number; sum: string };
};

export async function getMonthlyBillingSummary(
    ds: DataSource,
    opts?: { month?: string; teamId?: number; currency?: string }
): Promise<MonthlySummary> {
    const invoiceDate = parseMonth(opts?.month);
    const currency = String(opts?.currency ?? process.env.BILLING_CURRENCY ?? "EUR");
    const period = lastMonthPeriod(invoiceDate);

    const billQB = ds.getRepository(BillTable).createQueryBuilder("b")
        .where("b.date = :d", { d: ymd(invoiceDate) });
    if (opts?.teamId) billQB.andWhere("b.team_id = :tid", { tid: opts.teamId });
    const bills = await billQB.getMany();

    const invoiceIds = bills.map(b => b.id);
    const mainTeamIds = bills.map(b => b.team_id);
    const rows = invoiceIds.length
        ? await ds.getRepository(BillRowTable).find({ where: { bill: In(invoiceIds) } })
        : [];

    // Соберём id всех команд, упомянутых в отчёте (основные + billable)
    const billableIds = rows.map(r => Number(r.billable_team_id)).filter(n => Number.isFinite(n));
    const teamIds = Array.from(new Set([...mainTeamIds, ...billableIds]));
    const teams = teamIds.length
        ? await ds.getRepository(TeamTable).find({ where: { id: In(teamIds) } })
        : [];
    const teamById = new Map(teams.map(t => [t.id, t]));

    // Баланс-проводки на дату инвойса
    const balances = mainTeamIds.length
        ? await ds.getRepository(BalanceTable).createQueryBuilder("bal")
            .where("bal.date = :d", { d: ymd(invoiceDate) })
            .andWhere("bal.team_id IN (:...ids)", { ids: mainTeamIds })
            .getMany()
        : [];
    const balByTeamId = new Map(balances.map(b => [b.team_id, b]));

    const invoices: MonthlySummary["invoices"] = [];
    let sum = 0;

    for (const bill of bills) {
        const rws = rows.filter(r => r.bill === bill.id);
        const normalizedRows = rws.map(r => {
            const billableId = Number(r.billable_team_id);
            const t = teamById.get(billableId);

            const amountStr = String((r as any).amount);           // ← всегда строка
            const amountNum = Number(amountStr);                   // ← число для сумм

            return {
                billableTeamId: String((r as any).billable_team_id),
                billableTeamTitle: t?.title ?? "",
                discountPct: String((r as any).discaunt),
                amount: amountStr,
                _amountNum: Number.isFinite(amountNum) ? amountNum : 0,
            };

        });
        const totalNum = normalizedRows.reduce((acc, r) => acc + r._amountNum, 0);
        sum += totalNum;

        const mainTeam = teamById.get(bill.team_id);
        const bal = balByTeamId.get(bill.team_id);

        invoices.push({
            billId: bill.id,
            teamId: bill.team_id,
            teamTitle: mainTeam?.title ?? "",
            date: ymd(bill.date as unknown as Date),
            rowsCount: normalizedRows.length,
            total: totalNum.toFixed(2),
            balanceEntry: bal ? { id: bal.id, summa: String(bal.summa), document: bal.document } : null,
            rows: normalizedRows.map(({ _amountNum, ...pub }) => pub)
        });
    }

    return {
        invoiceDate: ymd(invoiceDate),
        servicePeriod: { from: ymd(period.from), to: ymd(period.to) },
        currency,
        invoices,
        totals: { invoices: invoices.length, sum: sum.toFixed(2) }
    };
}

export function summaryToCSV(summary: MonthlySummary): string {
    // Заголовки
    const head = [
        "invoice_date",
        "service_from",
        "service_to",
        "bill_id",
        "main_team_id",
        "main_team_title",
        "row_idx",
        "billable_team_id",
        "billable_team_title",
        "discount_pct",
        "amount",
        "currency",
        "bill_total",
        "balance_id",
        "balance_summa",
        "balance_document"
    ].join(",");

    const lines: string[] = [head];
    for (const inv of summary.invoices) {
        inv.rows.forEach((row, idx) => {
            const cells = [
                summary.invoiceDate,
                summary.servicePeriod.from,
                summary.servicePeriod.to,
                inv.billId,
                inv.teamId,
                csv(inv.teamTitle),
                idx + 1,
                row.billableTeamId,
                csv(row.billableTeamTitle),
                csv(row.discountPct),
                row.amount,
                summary.currency,
                inv.total,
                inv.balanceEntry?.id ?? "",
                inv.balanceEntry?.summa ?? "",
                csv(inv.balanceEntry?.document ?? "")
            ];
            lines.push(cells.join(","));
        });
    }
    // в конце можно добавить строку TOTALS
    lines.push(["TOTALS", "", "", "", "", "", "", "", "", "", "", summary.currency, summary.totals.sum].join(","));
    return lines.join("\n");

    function csv(v: string) {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }
}
