
// pages/api/landing/save-lead-api.ts 
// для приёма заявок с лендинга
import { ulogger } from "./../../../lib/common/universal-logger";
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites'
import { createLead } from './../../../handlers/handlers-update';  // расчеты
import { LeadTable } from './../../../db/models/landing/leads';
import { LeadItem, LeadStatus } from "@/types/leads-types";


interface RequestBody {
  lead: LeadItem,  
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  try {
    const db = await connectDb();
    const leadRepository = getTypedRepository(db, 'LeadTable', LeadTable);
    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    switch (req.method) {

      case 'POST':
        // запись сообщения поддержки
        const { lead } = req.body as RequestBody;

        const resLead = await createLead(lead, leadRepository)
        if (!resLead.success) {
          res.status(200).json({
            success: false,
            message: resLead.message
          });
          break;
        }

        res.status(200).json({
          success: true,
        });
        break;

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
      location: "pages/api/landing/save-lead-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default handler