// /lib/auth.ts — генерация и проверка токена
import { sign, verify } from 'jsonwebtoken'

const SECRET = process.env.JWTSECRET!

export function createToken(payload: object) {
  return sign(payload, SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string) {
  try {
    return verify(token, SECRET)
  } catch {
    return null
  }
}