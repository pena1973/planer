// pages/api/auth/reset-password-final.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites';
import { UserTable } from './../../../db/models/catalogs/users';
import { scryptHash } from './../../../lib/scrypt';

const schema = z.object({
  verifyToken: z.string(),
  newPassword: z.string().min(8).max(128),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).end();

  let payload: any;
  try { payload = jwt.verify(parsed.data.verifyToken, process.env.JWT_SECRET!); }
  catch { return res.status(200).json({ ok: false }); }

  if (payload.type !== 'verify' || payload.purpose !== 'password_reset') {
    return res.status(200).json({ ok: false });
  }

  const email = payload.sub as string;
  const db = await connectDb();
  const repo = getTypedRepository(db,'UserTable', UserTable);

  const pass = await scryptHash(parsed.data.newPassword);
  await repo.createQueryBuilder()
    .update(UserTable)
    .set({ pass, password_changed_at: () => 'now()' })
    .where('email = :email', { email })
    .execute();

  return res.status(200).json({ ok: true });
}
