// pages/api/auth/send-code.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import connectDb from '@/db/database';
import { getTypedRepository } from '@/db/utilites';
import { VerificationCodeTable } from '@/db/models/auth/verification_code';
import { genCode, hashCode, addMinutes } from './../../../lib/code';
import nodemailer from 'nodemailer';

const bodySchema = z.object({
  email: z.string().email(),
  purpose: z.enum(['signup','password_reset','email_change','login_2fa']),
  locale: z.enum(['ru','en']).optional(),
});

const TTL_MIN = 10;
const RATE_MIN = 10;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 10;
const RESEND_COOLDOWN_SEC = 60;

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(200).json({ ok: true, cooldownSec: RESEND_COOLDOWN_SEC });

  const { email, purpose, locale } = parsed.data;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
          || req.socket.remoteAddress || null;

  const db = await connectDb();
  const repo = getTypedRepository(db, 'VerificationCodeTable',VerificationCodeTable);
  const since = new Date(Date.now() - RATE_MIN * 60 * 1000);

  const emailCount = await repo.createQueryBuilder('v')
    .where('v.email = :email', { email })
    .andWhere('v.created_at >= :since', { since })
    .getCount();
  if (emailCount >= MAX_PER_EMAIL) return res.status(200).json({ ok: true, cooldownSec: RESEND_COOLDOWN_SEC });

  if (ip) {
    const ipCount = await repo.createQueryBuilder('v')
      .where('v.request_ip = :ip', { ip })
      .andWhere('v.created_at >= :since', { since })
      .getCount();
    if (ipCount >= MAX_PER_IP) return res.status(200).json({ ok: true, cooldownSec: RESEND_COOLDOWN_SEC });
  }

  const code = genCode(6);
  const rec = repo.create({
    email,
    purpose,
    code_hash: await hashCode(code),
    expires_at: addMinutes(new Date(), TTL_MIN),
    request_ip: ip ?? null,
  });
  await repo.save(rec);

  const subj = (locale ?? 'ru') === 'ru' ? 'Код подтверждения' : 'Verification code';
  const text = (locale ?? 'ru') === 'ru'
    ? `Ваш код (${purpose}): ${code}\nДействителен 10 минут.`
    : `Your code (${purpose}): ${code}\nValid for 10 minutes.`;

  try { await mailer.sendMail({ from: process.env.MAIL_FROM || 'no-reply@example.com', to: email, subject: subj, text }); } catch {}

  return res.status(200).json({ ok: true, cooldownSec: RESEND_COOLDOWN_SEC });
}
