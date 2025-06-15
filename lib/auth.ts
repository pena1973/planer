// /lib/auth.ts — генерация и проверка токена
// import { sign, verify } from 'jsonwebtoken'

// const SECRET = process.env.JWTSECRET!

// export function createToken(payload: object) {
//   return sign(payload, SECRET, { expiresIn: '24h' })
// }

// export function verifyToken(token: string) {
//   try {
//     return verify(token, SECRET)
//   } catch {
//     return null
//   }
// }

import { sign, verify } from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWTSECRET!
const REFRESH_SECRET = process.env.JWTREFRESHSECRET!  // добавь в .env

export function createAccessToken(payload: object) {
  return sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function createRefreshToken(payload: object) {
  return sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string) {
  try {
    return verify(token, ACCESS_SECRET)
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return verify(token, REFRESH_SECRET)
  } catch {
    return null
  }
}
