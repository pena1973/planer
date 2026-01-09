// // lib/server/withAuth.ts  — обёртка для API  проверка токена

// import type { MyJwtPayload } from './../../types/auth-types';
// import { verifyAccessToken } from './../common/auth'
// import type { NextApiRequest, NextApiResponse } from 'next'

// interface AuthenticatedRequest extends NextApiRequest {
//   user: MyJwtPayload;
// }

// export function withAuth(
//   handler: (req: AuthenticatedRequest, res: NextApiResponse) => void | Promise<void>
// ) {
//   return async (req: NextApiRequest, res: NextApiResponse) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Basic ')) {
//       console.warn(`[AUTH] ❌ Нет токена. IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
//       return res.status(401).json({ error: 'Token not provided' });
//     }

//     const token = authHeader.split(' ')[1];
//     const payload = verifyAccessToken(token);

//     if (!payload) {
//       console.warn(`[AUTH] ❌ Неверный токен. IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
//       return res.status(403).json({ error: 'Invalid or expired access token' })
//     }

//     const reqWithUser = req as AuthenticatedRequest;
//     reqWithUser.user = payload;

//     // console.log(`[AUTH] ✅ ${payload.login} → ${req.method} ${req.url}`);
    
//     return handler(reqWithUser, res);
//   };
// }

// lib/server/withAuth.ts

import type { MyJwtPayload } from './../../types/auth-types';
import { verifyAccessToken } from './../common/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

interface AuthenticatedRequest extends NextApiRequest {
  user: MyJwtPayload;
}

type UnknownRecord = Record<string, unknown>;

function getClientIp(req: NextApiRequest) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null;
}

function toNum(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function getIdFrom(obj: unknown, key: 'userId' | 'teamId'): number | undefined {
  if (!isRecord(obj)) return undefined;
  return toNum(obj[key]);
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => void | Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = getClientIp(req);

    const authHeader = req.headers.authorization;

    // поддержим и Basic, и Bearer (на будущее)
    if (!authHeader || !(authHeader.startsWith('Basic ') || authHeader.startsWith('Bearer '))) {
      console.warn(`[AUTH] ❌ Нет токена. IP: ${ip}`);
      return res.status(401).json({ error: 'Token not provided' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      console.warn(`[AUTH] ❌ Неверный токен. IP: ${ip}`);
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }

    const reqWithUser = req as AuthenticatedRequest;
    reqWithUser.user = payload;

    // === КРИТИЧЕСКАЯ ПРОВЕРКА: token scope vs body/query ===
    // Проверяем только если userId/teamId присутствуют в body или query (чтобы не ломать старые ручки)
    const bodyUserId = getIdFrom(req.body, 'userId');
    const bodyTeamId = getIdFrom(req.body, 'teamId');

    // req.query в NextApiRequest: string | string[] | undefined
    // Приведем к числу аккуратно:
    const queryUserId = toNum(req.query.userId);
    const queryTeamId = toNum(req.query.teamId);

    const requestUserId = bodyUserId ?? queryUserId;
    const requestTeamId = bodyTeamId ?? queryTeamId;

    const mismatchUser = requestUserId !== undefined && requestUserId !== payload.userId;
    const mismatchTeam = requestTeamId !== undefined && requestTeamId !== payload.teamId;

    if (mismatchUser || mismatchTeam) {
      console.warn(
        `[AUTH] ❌ Scope mismatch. IP=${ip} token(userId=${payload.userId}, teamId=${payload.teamId}) ` +
          `req(userId=${requestUserId}, teamId=${requestTeamId}) url=${req.url}`
      );

      return res.status(403).json({
        error: 'Forbidden: token scope mismatch',
        message:
          'userId/teamId в запросе (body/query) не совпадают с userId/teamId из токена. ' +
          'Нельзя выполнять операции от имени другого пользователя/команды.',
        tokenScope: { userId: payload.userId, teamId: payload.teamId },
        requestScope: { userId: requestUserId, teamId: requestTeamId },
      });
    }

    return handler(reqWithUser, res);
  };
}
