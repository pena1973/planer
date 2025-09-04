
// pages/api/auth/send-code.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites';
import { VerificationCodeTable } from './../../../db/models/auth/verification_code'; // единая таблица кодов
import { genCode, hashCode, addMinutes } from './../../../lib/code';            // см. ранее -утилиты

// вверху файла
const APP_BASE_URL =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`;


const Body = z.object({
    email: z.string().email(),
    purpose: z.enum(['signup', 'password_reset']).default('signup'),
    locale: z.enum(['ru', 'en']).optional(),
});

const CODE_TTL_MIN = 30;
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return res.status(200).json({ success: true }); // одинаковый ответ, чтобы не палить наличие email

    const { email, purpose, locale } = parsed.data;

    try {
        // 1) Сгенерировать код
        const code = genCode(6);

        // 2) Сохранить верификацию в БД (храним ТОЛЬКО хэш)
        const db = await connectDb();
        const repo = getTypedRepository(db, 'VerificationCodeTable', VerificationCodeTable);
        const rec = repo.create({
            email,
            purpose,
            code_hash: await hashCode(code),
            expires_at: addMinutes(new Date(), CODE_TTL_MIN),
            used: false,
            attempts: 0,
            max_attempts: 6,
        });
        await repo.save(rec);





        // 3) Отправить письмо через Resend (обходим перехватчик fetch)
        const realFetch: typeof fetch = (globalThis as any).__realFetch || fetch;
        const link = `${APP_BASE_URL}/auth/verify?email=${encodeURIComponent(email)}&purpose=${purpose}`;

        const subject = (locale ?? 'ru') === 'ru' ? 'Код подтверждения' : 'Verification code';

        const text =
            (locale ?? 'ru') === 'ru'
                ? `Ваш код (${purpose}): ${code}
                    Он действителен ${CODE_TTL_MIN} мин.
                    Чтобы ввести код, перейдите по ссылке: ${link}
                    Если вы не запрашивали код — просто игнорируйте это письмо.`
                : `Your code (${purpose}): ${code}
                    It is valid for ${CODE_TTL_MIN} minutes.
                    To enter the code, open: ${link}
                    If you didn't request this code, ignore this email.`;

        // лёгкая html-версия с кнопкой
        const html =
            (locale ?? 'ru') === 'ru'
                ? `<p>Ваш код (<b>${purpose}</b>): <b style="font-size:18px;letter-spacing:2px">${code}</b></p>
               <p>Он действителен ${CODE_TTL_MIN} минут.</p>
               <p><a href="${link}" style="display:inline-block;padding:10px 16px;border-radius:8px;text-decoration:none;border:1px solid #ddd">Ввести код</a></p>
               <p style="color:#666">Если вы не запрашивали код — проигнорируйте письмо.</p>`
                : `<p>Your code (<b>${purpose}</b>): <b style="font-size:18px;letter-spacing:2px">${code}</b></p>
               <p>It is valid for ${CODE_TTL_MIN} minutes.</p>
               <p><a href="${link}" style="display:inline-block;padding:10px 16px;border-radius:8px;text-decoration:none;border:1px solid #ddd">Enter code</a></p>
               <p style="color:#666">If you didn't request this code, please ignore this email.</p>`;


        const resp = await realFetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.MAIL_FROM!, // например: no-reply@plan-track.pro (домен в Resend верифицирован)
                to: email,
                subject,
                text,
                html,
            }),
        });

        // Логируем ответ Resend для дебага (не бросаем наружу детали)
        try {
            const dbg = await resp.json().catch(() => null);
            console.log('Resend response:', dbg || resp.status);
        } catch {
            console.log('Resend response status:', resp.status);
        }

        // 4) Всегда одинаковый ответ наружу
        return res.status(200).json({ success: true });
    } catch (e: any) {
        console.error('send-code error:', e?.response?.body || e?.message || e);
        // Даже при ошибке отдаём success:true, чтобы не раскрывать статусы/наличие пользователя
        return res.status(200).json({ success: true });
    }
}
