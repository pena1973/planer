// pages/api/admin/create-bills.ts
// проверяет баланс у команд и деактивирует если баланса недостаточно  - запускается раз в день
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/server/withAuth";

import connectDb from '../../../db/database';
import { getTypedRepository } from '../../../db/utilites'
import { BalanceTable } from '../../../db/models/billing/balance';
import { TeamTable } from '../../../db/models/catalogs/teams';

import { ActiveTimeTable } from '../../../db/models/billing/active_time';
import { MainTable } from '../../../db/models/billing/main';
// import { TeamScheduleTable } from './../../../db/models/plan/team_schedule';
// import { calcMonthlyTeamCosts } from "../../../handlers/calcMonthlyTeamCosts";
import { generateTeamNumber } from '@/lib/common/utils'
import { changeStateTeamsByIds } from './../../../handlers/handlers-update';
import { getTeams, getBalances } from './../../../handlers/handlers-get';
import { TeamItem } from "@/types/types";

const round2 = (n: number) => +Number(n ?? 0).toFixed(2);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const db = await connectDb();

  const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
  const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
  const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);
  const mainRepository = getTypedRepository(db, 'MainTable', MainTable);

  try {
    switch (req.method) {
      case 'GET': {
        // const { year, month } = req.query;

        // const endOfMonth = new Date(Number(year), Number(month), 0);
        // const ymd = endOfMonth.toLocaleDateString('en-CA'); // "YYYY-MM-DD"

        // 1) все балансы главных (или вообще всех) команд
        const balances = await getBalances(new Date().toLocaleDateString('en-CA'), balanceRepository); // [{teamId,balance}]
        // const balances = await getBalances(ymd, balanceRepository); // [{teamId,balance}]

        // const teamScheduleRepository = getTypedRepository(db, 'TeamScheduleTable', TeamScheduleTable);

        const balanceByTeam = new Map<number, number>(
          balances.map(b => [b.teamId, round2(b.balance)])
        );

        // 2) все команды
        const teams: TeamItem[] = await getTeams(teamsRepository);

        // 4) выделяем главные команды
        const mainTeams = teams.filter(t => generateTeamNumber(t.prefix, t.id) === t.main_team);

        // 5) собираем списки к деактивации
        const toDeactivateSet = new Set<number>();

        for (const main of mainTeams) {
          const mainTeamNumber = generateTeamNumber(main.prefix, main.id);

          // все команды группы (главная + пристёгнутые)
          const groupTeamIds = teams
            .filter(t => t.main_team === mainTeamNumber)
            .map(t => t.id);


          const balance = round2(balanceByTeam.get(main.id) ?? 0);

          if (balance <= 0) {
            // деактивируем всю группу
            for (const id of groupTeamIds) toDeactivateSet.add(id);
          }
        }

        const toDeactivate = Array.from(toDeactivateSet);

        // 6) если нечего деактивировать — просто ответим success
        if (toDeactivate.length === 0) {
          return res.status(200).json({ success: true, deactivated: 0, teams: [] });
        }

        // 7) изменение состояния активностей сразу пачкой
        const resTeams = await changeStateTeamsByIds(activeTimeRepository, toDeactivate, false);
        if (!resTeams.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + (resTeams.message ?? '') });
          return;
        }

        return res.status(200).json({
          success: true,
          deactivated: toDeactivate.length,
          teams: toDeactivate,
        });
      }

      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (deactivate-teams-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}

export default withAuth(handler);
