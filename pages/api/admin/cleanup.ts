// pages/api/admin/cleanup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/database';
import { runCleanupOnce } from '@/db/jobs/cleanup-scheduler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // проверь авторизацию!
  const db = await connectDb();
  const result = await runCleanupOnce(db);
  res.status(200).json(result);
}
