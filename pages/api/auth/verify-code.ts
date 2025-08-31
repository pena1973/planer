// pages/api/auth/verify-code.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import connectDb from '@/db/database';
import { getTypedRepository } from '@/db/utilites';
import { VerificationCodeTable } from '@/db/models/auth/verification_code';
import { checkCode } from './../../../lib/code';

const bodySchema = z.object({
  email: z.string().email(),
  purpose: z.enum(['signup','password_reset','email_change','login_2fa']),
  code: z.string().min(6).max(6).regex(/^\d{6}$/),
});

const VERIFY_TOKEN_TTL_SEC = 15 * 60;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(200).json({ ok: false, reason: 'invalid_or_expired' });

  const { email, purpose, code } = parsed.data;
  const db = await connectDb();
  const repo = getTypedRepository(db,'VerificationCodeTable', VerificationCodeTable);

  const rec = await repo.createQueryBuilder('v')
    .where('v.email = :email', { email })
    .andWhere('v.purpose = :purpose', { purpose })
    .andWhere('v.used = false')
    .orderBy('v.created_at', 'DESC')
    .getOne();

  const now = new Date();
  if (!rec || rec.expires_at < now || rec.attempts >= rec.max_attempts) {
    if (rec && rec.expires_at < now) { rec.used = true; await repo.save(rec); }
    return res.status(200).json({ ok: false, reason: 'invalid_or_expired' });
  }

  const ok = await checkCode(code, rec.code_hash);
  if (!ok) {
    rec.attempts += 1; await repo.save(rec);
    return res.status(200).json({ ok: false, reason: 'invalid_or_expired' });
  }

  rec.used = true; await repo.save(rec);

  const token = jwt.sign(
    { sub: email, purpose, type: 'verify' },
    process.env.JWT_SECRET!, { expiresIn: VERIFY_TOKEN_TTL_SEC }
  );

  return res.status(200).json({ ok: true, verifyToken: token, expiresIn: VERIFY_TOKEN_TTL_SEC });
}
