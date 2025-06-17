// /lib/auth.ts — генерация и проверка токена
import { sign, verify } from 'jsonwebtoken'

import type { MyJwtPayload } from '@/types/auth-types';

const ACCESS_SECRET = process.env.JWTSECRET!
const REFRESH_SECRET = process.env.JWTREFRESHSECRET!  // добавь в .env

export function createAccessToken(payload: object) {
  return sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function createRefreshToken(payload: object) {
  return sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

// export function verifyAccessToken(token: string) {
//   try {
//     return verify(token, ACCESS_SECRET)
//   } catch {
//     return null
//   }
// }


export function verifyAccessToken(token: string): MyJwtPayload | null {
  try {
    return verify(token, ACCESS_SECRET) as MyJwtPayload;
  } catch {
    return null;
  }
}

export interface TokenPayload {
  login: string;
  exp?: number; // если срок действия токена используется
  iat?: number; // issued at, тоже может быть
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return verify(token, REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

