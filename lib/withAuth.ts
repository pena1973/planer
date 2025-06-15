// lib/withAuth.ts  — обёртка для API  проверка токена

// lib/withAuth.ts
// import type { NextApiRequest, NextApiResponse } from 'next'
// import { verifyToken } from './auth'

// export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>) {
//   return async (req: NextApiRequest, res: NextApiResponse) => {
//     const authHeader = req.headers.authorization

//     if (!authHeader || !authHeader.startsWith('Basic ')) {
//       console.warn(`[AUTH] ❌ Нет токена. IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
//       return res.status(401).json({ error: 'Token not provided' })
//     }

//     const token = authHeader.split(' ')[1]
//     const payload = verifyToken(token)

//     if (!payload) {
//       console.warn(`[AUTH] ❌ Неверный токен. IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
//       return res.status(403).json({ error: 'Invalid or expired token' })
//     }

//     // Логируем пользователя и путь
//     const userLogin = (payload as any).login || 'неизвестно'
//     console.log(`[AUTH] ✅ ${userLogin} → ${req.method} ${req.url}`)

//     // @ts-ignore — добавляем пользователя в req
//     req.user = payload
//     return handler(req, res)
//   }
// }


import { verifyAccessToken } from './auth'
import type { NextApiRequest, NextApiResponse } from 'next'

export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.warn(`[AUTH] ❌ Нет токена. IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
      return res.status(401).json({ error: 'Token not provided' })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)

    if (!payload) {
      console.warn(`[AUTH] ❌ Неверный токен. IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
      return res.status(403).json({ error: 'Invalid or expired access token' })
    }

    //  Логируем пользователя и путь
    const userLogin = (payload as any).login || 'неизвестно'
    console.log(`[AUTH] ✅ ${userLogin} → ${req.method} ${req.url}`)

    // @ts-ignore
    req.user = payload
    return handler(req, res)
  }
}
