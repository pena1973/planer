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
import { UserAgreeTable } from './../db/models/catalogs/user_agree';
import { UserTable } from './../db/models/catalogs/users';
import connectDb from './../db/database';
import { TeamItem, ScheduleItem } from "@/types/types";
import { generateTeamNumber } from '@/lib/common/utils'
import { getCurrentDateInString } from '@/lib/common/timezone'
import { ulogger } from '@/lib/common/universal-logger';
import { SettingsTable } from '@/db/models/plan/settings';

const getPrevDay = (dateStr: string) => new Date(new Date(dateStr).getTime() - 86400000).toISOString().slice(0, 10);

export const jobs: Record<string, JobHandler> = {

    // ежедневное списание стоимости за предыдущий день
    // спаисание идет по таймзоне команды, запуск каждый час , защита от повтора
    'billing:charge': async (params) => {

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
                    false,
                    'daily charge-' + prevDay, "-", "")

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
    'cleanup:users': async () => {
        const db = await connectDb();

        const userAgreeRepository = getTypedRepository(db, 'UserAgreeTable', UserAgreeTable);
        const userRepository = getTypedRepository(db, 'UserTable', UserTable);

        const teamRepository = getTypedRepository(db, 'TeamTable', TeamTable);
        const teamSettingsRepository = getTypedRepository(db, 'SettingsTable', SettingsTable);
        const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

        const CLEANUP_UNCONFIRMED_USERS_DAYS =
            Math.max(1, Number(process.env.CLEANUP_UNCONFIRMED_USERS_DAYS ?? 7) || 7);

        const candidates = await userRepository
            .createQueryBuilder('u')
            .leftJoin('user_agree', 'ua', 'ua.user_id = u.id')
            .where(`u.created_at <= (NOW() - (:days * INTERVAL '1 day'))`, { days: CLEANUP_UNCONFIRMED_USERS_DAYS })
            .andWhere(`(ua.id IS NULL OR ua.signed = false)`)
            .select([
                'u.id AS id',
                'u.created_at AS created_at',
                'u.isAdmin AS isAdmin',
                'u.team_id AS team_id',
                'ua.id AS agree_id',
                'ua.signed AS signed',
            ])
            .getRawMany();

        for (const c of candidates) {
            const userId = Number(c.id);
            const teamId = c.team_id == null ? null : Number(c.team_id);
            const isAdmin = c.isAdmin === true;

            const logFail = (message: string, err?: any) => {
                void ulogger.error({
                    userId: null,
                    location: "cleanup:users",
                    event: "api_error",
                    message,
                    context: err?.stack ? String(err.stack).slice(0, 2000) : (err ? String(err) : ""),
                }).catch(() => console.warn(message, err));
            };

            try {
                // 1) удалить user-зависимости (плоско, вручную)
                // ВНИМАНИЕ: подстрой поля where под свои реальные колонки!
                // Ниже я предполагаю, что в таблицах есть user_id.

                // agreement — лучше удалить по user_id, а не по agree_id (т.к. плоско и может быть несколько записей)
                await userAgreeRepository.delete({ user_id: userId } as any).catch((e) => {
                    logFail(`UserAgree not deleted for userId=${userId}`, e);
                });

                // 2) удалить юзера
                const delUser = await userRepository.delete({ id: userId });
                if ((delUser.affected ?? 0) === 0) {
                    logFail(`User NOT deleted (affected=0). userId=${userId}`);
                    continue;
                }

                console.log('[cleanup:users] Deleted user', { userId, teamId, isAdmin });

                // 3) если админ — пробуем удалить команду, но ТОЛЬКО если команда пуста
                if (isAdmin && teamId) {
                    const usersLeft = await userRepository
                        .createQueryBuilder('u')
                        .where('u.team_id = :teamId', { teamId })
                        .getCount();

                    if (usersLeft > 0) {
                        console.log('[cleanup:users] Team not deleted: users still exist', { teamId, usersLeft });
                        continue;
                    }

                    // ВНИМАНИЕ: обычно тут ключ team_id, не id
                    await teamScheduleRepository.delete({ team_id: teamId } as any).catch((e) => {
                        logFail(`TeamSchedule not deleted for teamId=${teamId}`, e);
                    });

                    await teamSettingsRepository.delete({ team_id: teamId } as any).catch((e) => {
                        logFail(`TeamSettings not deleted for teamId=${teamId}`, e);
                    });

                    const delTeam = await teamRepository.delete({ id: teamId });
                    if ((delTeam.affected ?? 0) === 0) {
                        logFail(`Team NOT deleted (affected=0). teamId=${teamId}`);
                    } else {
                        console.log('[cleanup:users] Deleted empty team', { teamId });
                    }
                }
            } catch (e: any) {
                logFail(`Cleanup crashed for userId=${userId}, teamId=${teamId ?? 'null'}`, e);
                continue;
            }
        }
    }

    // добавляй свои ключи…
};


