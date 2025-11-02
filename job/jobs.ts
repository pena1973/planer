export type JobHandler = (params: Record<string, any> | null) => Promise<void> | void;
import { getTeams, getCostForDay, getTeamsShedule, getBalance, getTeamActivity } from './../handlers/handlers-get';
import { updateBalance, changeStateTeamsByIds } from './../handlers/handlers-update';
import { deleteDataOlder90 } from './../handlers/handlers-delete';

import { getTypedRepository } from './../db/utilites'
import { TeamTable } from './../db/models/catalogs/teams';
import { TeamScheduleTable } from './../db/models/plan/team_schedule';
import { MainTable } from './../db/models/billing/main';
import { BalanceTable } from './../db/models/billing/balance';
import { ActiveTimeTable } from './../db/models/billing/active_time';

import { UnitLoadTable } from './../db/models/plan/unit_loads';
import { TCardOperationTable } from './../db/models/data/t_card_operations';
import { TCardStageTable } from './../db/models/data/t_card_stages';
import { TCardProductTable } from './../db/models/data/t_card_products';
import { ProductTable } from './../db/models/data/products';
import { TCardTable } from './../db/models/data/t_cards';

import connectDb from './../db/database';
import { TeamItem, ScheduleItem } from "@/types/types";
import { generateTeamNumber } from '@/lib/common/utils'
import { getCurrentDateInString } from '@/lib/common/timezone'

const getPrevDay = (dateStr: string) => new Date(new Date(dateStr).getTime() - 86400000).toISOString().slice(0, 10);

export const jobs: Record<string, JobHandler> = {

    // ежедневное списание стоимости за предыдущий день
    // спаисание идет по таймзоне команды, запуск каждый час , защита от повтора
    'billing:charge': async (params) => {
        // const { getTeams, getCostForDay, getTeamsShedule, getBalance, getTeamActivity } = await import('../handlers/handlers-get');
        // const { updateBalance, changeStateTeamsByIds } = await import('../handlers/handlers-update');
        const db = await connectDb();
        const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
        const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);
        const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
        const mainRepository = getTypedRepository(db, 'MainTable', MainTable);
        const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
        // собираем все главные команды и проверяем начисление расхода за пред день
        const teams: TeamItem[] = await getTeams(null, "ru", teamsRepository);
        const teamActivity: { teamId: number, active: boolean }[] = await getTeamActivity(null, "ru", teams, activeTimeRepository)
        // собираем все таймзоны команд
        const teamsShedules: ScheduleItem[] = await getTeamsShedule(null, "ru", teams, teamScheduleRepository);

        for (let index = 0; index < teams.length; index++) {
            const team = teams[index];
            const timeZone = teamsShedules.find(shed => shed.teamId === team.id)?.timeZone ?? "Europe/Riga, UTC+2";
            const day = getCurrentDateInString(timeZone);

            const prevDay = getPrevDay(day);
            const teamNumber = generateTeamNumber(team.prefix, team.id);
            // подчиненные пропускаем
            if (teamNumber !== team.main_team)
                continue;
            //  расчет стоимости дня для основной команды + подчиненные
            const dayCost = await getCostForDay(null, "ru", team.id, prevDay, teamsRepository, activeTimeRepository, mainRepository)

            //  списание баланса
            if (dayCost === undefined) {
                console.log(`Стоимость дня не получена, дата: ${prevDay} teamId: ${team.main_team}`);
                console.log(`Команды не деактивированы teamId: ${team.main_team}`);
                return;
            }

            //  списываем если есть что списывать
            if (dayCost > 0) {
                const balanceRes = await updateBalance(
                    null,
                    "ru",
                    balanceRepository,
                    team.id,
                    "charge-" + prevDay,
                    dayCost / 100,
                    prevDay,
                    false,
                    'dayly charge-' + prevDay, "-", "")

                if (!balanceRes.success) {
                    console.log(`расход не списан, дата: ${prevDay} teamId: ${team.main_team}`);
                }
            }

            // ДЕАКТИВАЦИЯ за неуплату  только если сейчас активный
            const balance = await getBalance(null, "ru", prevDay, team.id, balanceRepository);
            if (!balance) {
                console.log(`Баланс не получен, дата: ${prevDay} teamId: ${team.main_team}`);
                console.log(`Команды не деактивированы teamId: ${team.main_team}`);
                return
            }
            if (balance <= 0) {
                // деактивируем Группу (только активных)
                const grope_teams = teams.filter(team => {
                    const activeTeam = teamActivity.find(a => a.teamId === team.id)
                    return team.main_team === teamNumber && activeTeam?.active
                }
                ).map(team => team.id);

                if (grope_teams.length > 0) {
                    const resAct = await changeStateTeamsByIds(null, "ru", activeTimeRepository, grope_teams, false, prevDay);
                    if (!resAct.success) {
                        console.log(`Команды не деактивированы teamIds: ${grope_teams}`);
                        return;
                    }
                }
            }
        }
    },
    'cleanup:core': async () => {
        const db = await connectDb();
        const unitLoadsRepository = getTypedRepository(db, 'UnitLoadTable', UnitLoadTable);
        const tCardOperationsRepository = getTypedRepository(db, 'TCardOperationTable', TCardOperationTable);
        const tCardStagesRepository = getTypedRepository(db, 'TCardStageTable', TCardStageTable);
        const tCardProductsRepository = getTypedRepository(db, 'TCardProductTable', TCardProductTable);
        const productsRepository = getTypedRepository(db, 'ProductTable', ProductTable);
        const tCardsRepository = getTypedRepository(db, 'TCardTable', TCardTable);
        // ежедневная очистка карт и интервалов которые старше 90 дней
        deleteDataOlder90(
            null, "ru",
            unitLoadsRepository,
            tCardOperationsRepository,
            tCardStagesRepository,
            tCardProductsRepository,
            productsRepository,
            tCardsRepository,
        )
        console.log('[job] cleanup:core');
    },
    // добавляй свои ключи…
};


