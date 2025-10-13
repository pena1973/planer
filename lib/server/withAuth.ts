// lib/server/withAuth.ts  — обёртка для API  проверка токена

import type { MyJwtPayload } from './../../types/auth-types';
import { verifyAccessToken } from './../common/auth'
import type { NextApiRequest, NextApiResponse } from 'next'

interface AuthenticatedRequest extends NextApiRequest {
  user: MyJwtPayload;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => void | Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.warn(`[AUTH] ❌ Нет токена. IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
      return res.status(401).json({ error: 'Token not provided' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      console.warn(`[AUTH] ❌ Неверный токен. IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
      return res.status(403).json({ error: 'Invalid or expired access token' })
    }

    const reqWithUser = req as AuthenticatedRequest;
    reqWithUser.user = payload;

    // console.log(`[AUTH] ✅ ${payload.login} → ${req.method} ${req.url}`);
    
    return handler(reqWithUser, res);
  };
}