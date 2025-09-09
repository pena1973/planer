// pages/api/admin/create-bills.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "./../../../lib/withAuth";
import { runMonthlyBilling } from "./../../../db/jobs/billing-core";

//  принудительный запуск рег задания формирования счетов на начало  заданного месяца и года
const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  const { year, month } = req.query;
  try {

    const { teamId: getTeamId } = req.query;

    switch (req.method) {
      case 'GET':
        const result = await runMonthlyBilling(Number(year),Number(month));
        
        if (!result.success) {
          res.status(500).json({ error: 'Не удалось обработать запрос. ' + result.message });
          return;
        }

        return res.status(200).json({
          success: true,
        });
        break;

      default:
        res.status(405).end(); // Метод не поддерживается
    }
  } catch (error) {
    console.error('Ошибка подключения или выполнения запроса (action-api):', error);
    res.status(500).json({ error: 'Не удалось обработать запрос' });
  }
}
export default withAuth(handler)