//pages/api/auth/send-code.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
import { getServerT } from '@/lib/server/i18n.server';


import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import connectDb from './../../../db/database';
import { getTypedRepository } from './../../../db/utilites';
import { VerificationCodeTable } from './../../../db/models/auth/verification_code';
import { genCode, hashCode, addMinutes } from './../../../lib/server/code';

const APP_BASE_URL =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`;

const Body = z.object({
    email: z.string().email(),
    purpose: z.enum(['signup', 'password_reset']).default('signup'),
    locale: z.enum(['ru', 'en']).optional(),
});

const CODE_TTL_MIN = 10;
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// ==== Вынесенные функции для генерации темы/текста/HTML ====
function buildSubject(locale: string | undefined): string {
    return (locale ?? 'ru') === 'ru'
        ? 'Код для входа — Plan&Track Pro'
        : 'Your sign‑in code — Plan&Track Pro';
}

function buildText(locale: string | undefined, purpose: string, code: string, link: string): string {
    // максимально нейтральный текст без спам-триггеров
    if ((locale ?? 'ru') === 'ru') {
        return `Здравствуйте.

Код для ${purpose === 'password_reset' ? 'смены пароля' : 'входа'}: ${code}
Срок действия: ${CODE_TTL_MIN} минут.

Страница подтверждения:
${link}

Если вы не запрашивали этот код, просто проигнорируйте письмо.

— Plan&Track Pro\nhttps://plan-track.pro`;
    }

    return `Hello,

Your ${purpose === 'password_reset' ? 'password reset' : 'sign‑in'} code: ${code}
Valid for: ${CODE_TTL_MIN} minutes.

Verification page:
${link}

If you didn't request this code, please ignore this message.

— Plan&Track Pro\nhttps://plan-track.pro`;
}

function buildHtml(locale: string | undefined, purpose: string, code: string, link: string): string {
    const purposeRu = purpose === 'password_reset' ? 'смены пароля' : 'входа';
    const purposeEn = purpose === 'password_reset' ? 'password reset' : 'sign‑in';

    if ((locale ?? 'ru') === 'ru') {
        return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.5;">
    <p>Здравствуйте.</p>
    <p>Код для ${purposeRu}: <span style="font-size:18px;font-weight:700;letter-spacing:2px">${code}</span></p>
    <p>Срок действия: ${CODE_TTL_MIN} минут.</p>
    <p>Страница подтверждения: <a href="${link}">${link}</a></p>
    <p style="color:#666;font-size:12px;margin-top:16px;">Если вы не запрашивали этот код, проигнорируйте письмо.</p>
    <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb" />
    <p style="font-size:12px;color:#666;margin:0;">— Plan&Track Pro · <a href="https://plan-track.pro" style="color:#2563eb;text-decoration:none;">plan-track.pro</a></p>
  </div>`;
    }

    return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.5;">
    <p>Hello,</p>
    <p>Your ${purposeEn} code: <span style="font-size:18px;font-weight:700;letter-spacing:2px">${code}</span></p>
    <p>Valid for: ${CODE_TTL_MIN} minutes.</p>
    <p>Verification page: <a href="${link}">${link}</a></p>
    <p style="color:#666;font-size:12px;margin-top:16px;">If you didn't request this code, please ignore this message.</p>
    <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb" />
    <p style="font-size:12px;color:#666;margin:0;">— Plan&Track Pro · <a href="https://plan-track.pro" style="color:#2563eb;text-decoration:none;">plan-track.pro</a></p>
  </div>`;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not supported.' });


    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return res.status(200).json({ success: true });

    const { email, purpose, locale } = parsed.data;

    const t = getServerT((locale) ? locale : 'en', 'translation'); // locale = 'ru' | 'en'

    try {
        // 1) Сгенерировать код
        const code = genCode(6);

        // 2) Сохранить хэш в БД
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

        // 3) Отправить письмо через Resend    
        type GlobalWithRealFetch = { __realFetch?: typeof fetch };
        const realFetch: typeof fetch = (globalThis as unknown as GlobalWithRealFetch).__realFetch || fetch;

        const link = `${APP_BASE_URL}/auth/verify?email=${encodeURIComponent(email)}&purpose=${purpose}`;

        const subject = buildSubject(locale);
        const text = buildText(locale, purpose, code, link);
        const html = buildHtml(locale, purpose, code, link);

        const resp = await realFetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.MAIL_FROM!,
                to: email,
                subject,
                text,
                html,
            }),
        });

        try {
            const dbg = await resp.json().catch(() => null);
            console.log('Resend response:', dbg || resp.status);
        } catch {
            console.log('Resend response status:', resp.status);
        }

        return res.status(200).json({ success: true });
    } catch (e: unknown) {
        // let message = "Ошибка при отправке кода.";
        let error = t('mes.errorSendCode');

        if (e instanceof Error) {
            // message = `Ошибка при отправке кода: ${e.message}`;
            error = `${t('mes.errorSendCode')}: ${e.message}`;
        } else if (typeof e === "object" && e !== null && "response" in e) {
            const errObj = e as { response?: { body?: unknown } };
            error = `${t('mes.errorSendCode')}: ${JSON.stringify(errObj.response?.body)}`;
        } else {
            error = `${t('mes.errorSendCode')}: ${String(e)}`;
        }

        //  logger
        void ulogger.error({
            userId: null,
            location: "pages/api/auth/send-code",
            event: "api_error",
            message: `catch: ${error}`,
            context: "",
        }).catch(() => { console.error("logger error") });

        res.status(500).json({ error: `${error}` });
    }   
}
