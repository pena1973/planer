// pages/api/landing/save-lead-api.ts 
// для приёма заявок с лендинга
import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from './../../../lib/server/i18n.server';

import { withAuth } from './../../../lib/server/withAuth'
import { NextApiRequest, NextApiResponse } from 'next';

import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites'

import { LeadTable } from './../../../db/models/landing/leads';
import { UserTable } from './../../../db/models/catalogs/users';

import { getLeads, } from './../../../handlers/handlers-get';
import { getUserById } from './../../../handlers/handlers-auth';


const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  try {
    const db = await connectDb();
    const leadRepository = getTypedRepository(db, 'LeadTable', LeadTable);
    const userRepository = getTypedRepository(db, 'UserTable', UserTable);

    const locale = getLocaleFromHeader(req.headers["x-lang"]);
    const t = getServerT(locale, 'sermes'); 

    switch (req.method) {      
      case 'GET':
        const {userId} = req.query;
        // проверякм имеет ли право юзер это получать
        const user = await getUserById(Number(userId), Number(userId), locale, userRepository);
        if (!user?.isSystem) {
          return res.status(403).json({ error: t('errors.no_permission') });
        }

        const leads = await getLeads(Number(userId), locale, leadRepository)

        res.status(200).json({
          success: true,
          leads: leads,
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
      location: "pages/api/landing/get-lead-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}

export default withAuth(handler)