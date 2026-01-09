// // /lib/server/auth.ts — генерация и проверка токена

// import { sign, verify } from 'jsonwebtoken'

// import type { MyJwtPayload } from './../../types/auth-types';

// const ACCESS_SECRET = process.env.JWTSECRET!
// const REFRESH_SECRET = process.env.JWTREFRESHSECRET!  // добавь в .env

// export function createAccessToken(payload: object) {
//   return sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
// }

// export function createRefreshToken(payload: object) {
//   return sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
// }

// export function verifyAccessToken(token: string): MyJwtPayload | null {
//   try {
//     return verify(token, ACCESS_SECRET) as MyJwtPayload;
//   } catch {
//     return null;
//   }
// }

// export interface TokenPayload {
//   login: string;
//   exp?: number; // если срок действия токена используется
//   iat?: number; // issued at, тоже может быть
// }

// export function verifyRefreshToken(token: string): TokenPayload | null {
//   try {
//     return verify(token, REFRESH_SECRET) as TokenPayload;
//   } catch {
//     return null;
//   }
// }

// /lib/server/auth.ts — генерация и проверка токена

import { sign, verify } from 'jsonwebtoken';
import type { MyJwtPayload } from './../../types/auth-types';

const ACCESS_SECRET = process.env.JWTSECRET!;
const REFRESH_SECRET = process.env.JWTREFRESHSECRET!;

// ✅ Access token ВСЕГДА содержит scope (userId/teamId)
export function createAccessToken(payload: MyJwtPayload) {
  // чтобы не утекли лишние поля случайно — явно отберём нужные
  const safePayload: MyJwtPayload = {
    login: payload.login,
    userId: payload.userId,
    teamId: payload.teamId,    
  };

  return sign(safePayload, ACCESS_SECRET, { expiresIn: '15m' });
}

// Refresh токен можно делать минимальным (например только login)
export interface TokenPayload {
  userId: number;
  teamId: number;
  login: string;
  exp?: number;
  iat?: number;
}

export function createRefreshToken(payload: TokenPayload) {
  const safePayload: TokenPayload = { login: payload.login, userId: payload.userId, teamId: payload.teamId };
  return sign(safePayload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): MyJwtPayload | null {
  try {
    return verify(token, ACCESS_SECRET) as MyJwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return verify(token, REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
