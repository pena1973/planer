// pages/api/admin/create-bills.ts
// проверяет баланс у команд и деактивирует если баланса недостаточно  - запускается раз в день
import { ulogger } from "./../../../lib/common/universal-logger";

import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/server/withAuth";

import connectDb from '../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from '../../../db/utilites'
import { BalanceTable } from '../../../db/models/billing/balance';
import { TeamTable } from '../../../db/models/catalogs/teams';

import { ActiveTimeTable } from '../../../db/models/billing/active_time';
import { generateTeamNumber } from '@/lib/common/utils'
import { changeStateTeamsByIds } from './../../../handlers/handlers-update';
import { getTeams, getBalances } from './../../../handlers/handlers-get';
import { TeamItem } from "@/types/types";
import { YYYYMMDD } from "@/lib/common/utils"

const round2 = (n: number) => +Number(n ?? 0).toFixed(2);

interface RequestBody {
  userId: number,

}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const db = await connectDb();

    const balanceRepository = getTypedRepository(db, 'BalanceTable', BalanceTable);
    const teamsRepository = getTypedRepository(db, 'TeamTable', TeamTable);
    const activeTimeRepository = getTypedRepository(db, 'ActiveTimeTable', ActiveTimeTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {
      case 'POST': {
        const { userId } = req.body as RequestBody;

        // 1) все балансы главных (или вообще всех) команд
        const balances = await getBalances(Number(userId), YYYYMMDD(), balanceRepository); // [{teamId,balance}]

        const balanceByTeam = new Map<number, number>(
          balances.map(b => [b.teamId, round2(b.balance)])
        );

        // 2) все команды
        const teams: TeamItem[] = await getTeams(Number(userId), locale, teamsRepository);

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
          res.status(200).json({ success: true, deactivated: 0, teams: [] });
          break;
        }

        // 7) изменение состояния активностей сразу пачкой
        const resTeams = await changeStateTeamsByIds(Number(userId), locale, activeTimeRepository, toDeactivate, false);
        if (!resTeams.success) {
          res.status(200).json({
            success: false,
            message: resTeams.message,
          });
          break;
        }

        res.status(200).json({
          success: true,
          deactivated: toDeactivate.length,
          teams: toDeactivate,
        });
        break
      }

      default:
        res.status(405).json({ error: 'Method not supported.' });
    }
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/admin/deactivate-teams-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler);
