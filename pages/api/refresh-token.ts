import { verifyRefreshToken, createAccessToken } from '@/lib/auth'
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const refreshToken = req.cookies?.refreshToken

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token not found' })
  }

  const payload = verifyRefreshToken(refreshToken)
  if (!payload) {
    return res.status(403).json({ error: 'Refresh token invalid or expired' })
  }

  const newAccessToken = createAccessToken({ login: (payload as any).login })
  res.status(200).json({ token: newAccessToken })
}
