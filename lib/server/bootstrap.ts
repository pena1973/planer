// /lib/server/bootstrap.ts
import 'server-only';
import { startJobsInThisProcess } from '@/job/engine';

let started = false;

export async function bootstrapServerOnce() {
  if (started) return;
  started = true;
 
  await startJobsInThisProcess();
}
