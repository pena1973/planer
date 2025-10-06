// pages/api/ping.ts
// Простой API для проверки работоспособности сервера
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔥 ping received');
  res.status(200).json({ ok: true });
}