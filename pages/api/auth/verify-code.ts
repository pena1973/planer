// pages/api/auth/verify-code.ts
// /api/auth/verify-code 
// — проверяет код, помечает как used, 
// выдаёт короткий verifyToken (JWT, 15 мин) 
// для следующего шага.
import type { NextApiRequest, NextApiResponse } from 'next';
import { success, z } from 'zod';
import jwt from 'jsonwebtoken';
import connectDb from '@/db/database';
import { getTypedRepository } from './../../../db/utilites';
import { VerificationCodeTable } from './../../../db/models/auth/verification_code';
import { UserTable } from './../../../db/models/catalogs/users';
// import { checkCode } from './../../../lib/code';
import { verifyCode, confirmUserEmail } from './../../../handlers/handlers-auth';

const bodySchema = z.object({
    email: z.string().email(),
    purpose: z.enum(['signup', 'password_reset', 'email_change', 'login_2fa']),
    code: z.string().min(6).max(6).regex(/^\d{6}$/),
});

const VERIFY_TOKEN_TTL_SEC = 15 * 60;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(200).json({ success: false, reason: 'invalid_or_expired' });

    const { email, purpose, code } = parsed.data;
    const db = await connectDb();

    const verificationCodeRepository = getTypedRepository(db, 'VerificationCodeTable', VerificationCodeTable);
    const usersRepository = getTypedRepository(db, 'UserTable', UserTable);

    const resCode = await verifyCode(email, code, purpose, verificationCodeRepository)
    
    if (!resCode.success) {
        return res.status(200).json({ success: false, reason: resCode.reason });
    }

    const resUser = await confirmUserEmail(email, usersRepository)
    if (!resUser.success) {
        res.status(200).json({
            success: false,
            message: resUser.message,
        });
        return;
    }

    if (!resUser.success) {
        res.status(500).json({ error: 'Не удалось обработать запрос. ' + resUser.message });
        return;
    }

    // токен нужен для восстановления пароля или подтверждения email
    const token = jwt.sign(
        { sub: email, purpose, type: 'verify' },
        process.env.JWTSECRET!, { expiresIn: VERIFY_TOKEN_TTL_SEC }
    );

    return res.status(200).json({ success: true, verifyToken: token, expiresIn: VERIFY_TOKEN_TTL_SEC });
}
