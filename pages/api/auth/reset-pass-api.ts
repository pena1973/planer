
//pages/api/auth/register-api.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';

// pages/api/auth/reset-password-final.ts
// /api/auth/reset-password-final — 
// по verifyToken (purpose='password_reset') 
// принимает новый пароль, 
// пишет в users.pass (scrypt-хэш) 
// и ставит password_changed_at = now().
import type { NextApiRequest, NextApiResponse } from 'next';
// import { z } from 'zod';
// import jwt from 'jsonwebtoken';
import connectDb from './../../../db/database';
import { getLocaleFromHeader } from './../../../lib/server/locale';
import { getTypedRepository } from './../../../db/utilites';
import { UserTable } from './../../../db/models/catalogs/users';
import { resetUserPass } from './../../../handlers/handlers-auth';


interface RequestBody {
  email: string,
  pass: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end();

    const locale = getLocaleFromHeader(req.headers["x-lang"]);

    const { email, pass } = req.body as RequestBody;

    const db = await connectDb();
    const usersRepository = getTypedRepository(db, 'UserTable', UserTable);

    const resReset = await resetUserPass(locale, email, pass, usersRepository)

    return res.status(200).json({ 
      success: resReset.success, 
      message: resReset.message 
    });

  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/auth/reset-pass-api",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}
