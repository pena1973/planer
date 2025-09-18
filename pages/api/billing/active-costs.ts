// // pages/api/billing/active-costs.ts
// import type { NextApiRequest, NextApiResponse } from "next";
// import { AppDataSource } from "@/db/data-source";
// import { calcMonthlyTeamCosts, TeamMonthlyCost } from "../../../handlers/calcMonthlyTeamCosts";
// import connectDb from '../../../db/database';

// import { TeamTable } from "../../../db/models/catalogs/teams";
// import { ActiveTimeTable } from "../../../db/models/billing/active_time";
// import { MainTable } from "../../../db/models/billing/main";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     const db = await connectDb();
//     try {
//         const teamRepository = db.getRepository(TeamTable);
//         const activeTimeRepository = db.getRepository(ActiveTimeTable);
//         const mainRepository = db.getRepository(MainTable);

//         const { month, year, base, disc } = req.query;
//         const month_ = Number(month);
//         const year_ = Number(year);
//         const price = Number(base);
//         const discount = Number(disc);


//         if (!AppDataSource.isInitialized) await AppDataSource.initialize();
//         const data: TeamMonthlyCost[] = await calcMonthlyTeamCosts(null, teamRepository, activeTimeRepository, mainRepository, year_, month_);

//         res.status(200).json({ year, month, price: price, discount: discount, data });
//     } catch (error) {
//         console.error('Ошибка подключения или выполнения запроса (active-costs):', error);
//         res.status(500).json({ error: 'Не удалось обработать запрос' });

//     }
// }
