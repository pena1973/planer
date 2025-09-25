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
import { getLocaleFromHeader } from './../../../lib/server/translate/locale';
import { getTypedRepository } from './../../../db/utilites';
import { UserTable } from './../../../db/models/catalogs/users';
import { resetUserPass } from './../../../handlers/handlers-auth';


interface RequestBody {
  email: string,
  pass: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
 
  const locale = getLocaleFromHeader(req.headers["x-lang"]);
 
  const { email, pass } = req.body as RequestBody;

  const db = await connectDb();
  const usersRepository = getTypedRepository(db, 'UserTable', UserTable);
  const resReset = await resetUserPass(locale, email, pass, usersRepository)

  return res.status(200).json({ success: resReset.success, message: resReset.message });
}
