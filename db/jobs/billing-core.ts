import { DataSource, Repository } from "typeorm";
import { TeamTable } from "./../models/catalogs/teams";
import { ActiveTimeTable } from "./../models/billing/active_time";
import { MainTable } from "./../models/billing/main";
import { BillTable } from "./../models/billing/bills";
import { BillRowTable } from "./../models/billing/bill_row";
import { ClientTable } from "./../models/billing/clients";
import { BalanceTable } from "./../models/billing/balance";
import { getTeams, getClients, getMain } from './../../handlers/handlers-get';
import { updateBill, updateBalance } from './../../handlers/handlers-update';
import connectDb from "@/db/database";
import { getTypedRepository, } from './../../db/utilites'
import { generateTeamNumber } from './../../lib/utils'
import { calcMonthlyTeamCosts } from "./../../handlers/calcMonthlyTeamCosts";

import { TeamItem } from './../../types/types'
import { BillItem, MainItem } from "@/types/service-types";

const shiftMonthBack = (year: number, month: number): { year: number, month: number } => {
    if (month === 1) {
        return { year: year - 1, month: 12 }; // январь → декабрь предыдущего года
    }
    return { year, month: month - 1 };
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
export async function runMonthlyBilling(
    year: number,
    month: number,
): Promise<{ success: boolean, BillingRunResult?: BillingRunResult, message?: "" }> {

    const db = await connectDb();
    const teamRepository = getTypedRepository(db, 'TeamTable', TeamTable);
    const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
    const mainRepository = getTypedRepository(db, 'MainTable', MainTable);
    const billsRepository = getTypedRepository(db, 'BillTable', BillTable);
    const billsRowRepository = getTypedRepository(db, 'BillRowTable', BillRowTable);
    // const clientRepository = getTypedRepository(db, 'ClientTable', ClientTable);
    const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
    const teams: TeamItem[] = await getTeams(teamRepository);

    const { year: prevYear, month: prevMonth } = shiftMonthBack(year, month)

    const allCosts = await calcMonthlyTeamCosts(null, teamRepository, activeTimeRepository, mainRepository, prevYear, prevMonth);
    // // ищем  клиентов
    // const clients = await getClients(clientRepository);

    // ищем собственные реквизиты
    const main = await getMain(mainRepository, `${year}-${month}-01`);


    // Получим главные команды
    const mainTeams = teams.filter(team => team.main_team === generateTeamNumber(team.prefix, team.id))

    // формируем счета
    for (let index = 0; index < mainTeams.length; index++) {
        const mainTeam = mainTeams[index];
        // ищем пристегнутые команды
        const groupeTeam = teams.filter(team => team.main_team === mainTeam.main_team)
        const groupeTeamIds = groupeTeam.map(team => team.id);
        // ищем строки использования
        const teamsCost = allCosts.filter(cost => groupeTeamIds.includes(cost.teamId));
        // Формируем записи счета если есть что формировать
        if (teamsCost.length === 0) continue;
        //    Ищем клиента
        // const client = clients.find(cl => cl.teamId === mainTeam.id)
        let amount = 0;
        // вычисляем строки счета
        let rows = [] as { id?: string, billableTeamNumber: string; price: number, amount: number, discount: number, dateFrom: string, dateTo: string, activeDays: number }[];
        for (let index = 0; index < teamsCost.length; index++) {
            const teamCost = teamsCost[index];
            amount = amount + Number(teamCost.amountteam);
            const team = groupeTeam.find(team => team.id === teamCost.teamId) ?? {} as TeamItem
            const prevMonthStr = String(prevMonth).padStart(2, '0');
            rows.push({
                billableTeamNumber: generateTeamNumber(team.prefix, team.id),
                dateFrom: `${prevYear}-${prevMonthStr}-01`,
                dateTo: `${prevYear}-${prevMonthStr}-${teamCost.daysInMonth}`,
                price: teamCost.priceteam,
                amount: teamCost.amountteam,
                discount: teamCost.discountteam,
                activeDays: teamCost.activeDays,
            })
        }

        // делаем счет если есть что начислить

        if (rows.length > 0) {
            const bill = {
                date: `${year}-${month}-01`,
                dueDate: `${year}-${month}-10`,
                title: `Invoice ${year}-${month}`,
                teamId: mainTeam.id, // id команды, для которой выдан счет                       
                amount: Number(amount.toFixed(2)), // общая сумма счета
                vat: main.VAT,
                vatAmount: Number((amount * main.VAT / 100).toFixed(2)),
                totalAmount: Number((amount * (1 + main.VAT / 100)).toFixed(2)),
                rows: rows, // товары или услуги в счете   
            } as BillItem

            const billRes = await updateBill(billsRepository, billsRowRepository, bill)
            if (!billRes.success) {
                console.log("счет не сформирован" + bill);
            }

            // проводка списания баланса            
            const balanceRes = await updateBalance(
                balanceRepository,
                bill.teamId,
                bill.amount,
                bill.date,
                false,
                'inv - ' + bill.date,
                "-","")
            if (!balanceRes.success) {
                console.log("баланс не списан" + bill);
            }
        } else (console.log("Нечего начислять по команде: " + generateTeamNumber(mainTeam.prefix, mainTeam.id)))

    }

    return { success: true, };
}

