// /job/engine.ts
import 'server-only'; 
import { DataSource } from 'typeorm';
import { JobSettingsTable } from '@/db/models/job/job-settings';
import { jobs } from '@/job/jobs';
import { computeNextRun } from '@/job/computeNextRun';
import { getTypedRepository } from './../db/utilites'
import connectDb from './../db/database';

const TICK_MS = Number(process.env.JOB_TICK_MS ?? 30000);

export async function startJobsInThisProcess() {
    if ((global as any).__JOBS_STARTED__) return;
    (global as any).__JOBS_STARTED__ = true;
    const db = await connectDb();
    const repo = getTypedRepository(db, 'JobSettingsTable', JobSettingsTable);

    const loop = async () => {
        const now = new Date();

        const rows = await repo.find(); // всегда читаем свежие данные
        for (const s of rows) {
            if (!s.enabled || !s.next_run_at || s.next_run_at > now) continue;

            const handler = jobs[s.job_key];
            try {
                if (handler) {
                    await handler(null); // у тебя job_params нет
                } else {
                    console.warn('[job] no handler for', s.job_key);
                }

                s.last_run_at = now;
                s.next_run_at = computeNextRun(s, now);
                await repo.update({ id: s.id }, {
                    last_run_at: s.last_run_at,
                    next_run_at: s.next_run_at,
                });
            } catch (e) {
                console.error('[job] failed', s.job_key, e);
                const fallback = new Date(now.getTime() + 5 * 60 * 1000);
                s.next_run_at = computeNextRun(s, now) ?? fallback;
                await repo.update({ id: s.id }, { next_run_at: s.next_run_at });
            }
        }
    };

    // первый проход и дальше с интервалом
    loop().catch(console.error);
    setInterval(() => loop().catch(console.error), TICK_MS);

    console.log('[job] started');
}
