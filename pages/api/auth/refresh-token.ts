//pages/api/template-api.ts
// API для получения, создания, обновления и удаления 
// Используется в 

import { ulogger } from "./../../../lib/common/universal-logger";
// import { getServerT } from '@/lib/server/i18n.server';

import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyRefreshToken, createAccessToken } from './../../../lib/common/auth'

export interface TokenPayload {
  login: string;
  exp?: number;
  iat?: number;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ error: 'Refresh token invalid or expired' });
    }

    const newAccessToken = createAccessToken({ login: payload.login });
    res.status(200).json({ token: newAccessToken });
  } catch (e: unknown) {
    let error = "";
    if (e instanceof Error) {
      error = e.message;
    }
    //  logger
    void ulogger.error({
      userId: null,
      location: "pages/api/auth/refresh-token",
      event: "api_error",
      message: `catch: ${error}`,
      context: "",
    }).catch(() => { console.error("logger error") });
    res.status(500).json({ error: `${error}` });
  }
}
