import { DataSource } from 'typeorm';
import { cleanupOldLoadsAndCards } from './cleanup-core.ts';
import { entities } from '../entities';

// Один раз (ручной запуск или из планировщика)
export async function runCleanupOnce(db: DataSource) {
  if (!db.isInitialized) await db.initialize();

  const repositories = {
    unitLoads: db.getRepository(entities.UnitLoadTable),
    tCards: db.getRepository(entities.TCardTable),
    tCardOperations: db.getRepository(entities.TCardOperationTable),
    tCardProducts: db.getRepository(entities.TCardProductTable),
    tCardStages: db.getRepository(entities.TCardStageTable),
    products: db.getRepository(entities.ProductTable),
  };

  return cleanupOldLoadsAndCards(repositories);
}

// Ежедневный запуск по ENV: CLEANUP_ENABLED, CLEANUP_RUN_AT=HH:MM
export function startCleanupScheduler(db: DataSource) {
  // не даём стартовать дважды
  if ((globalThis as any).__cleanupSchedulerStarted) return;
  (globalThis as any).__cleanupSchedulerStarted = true;

  const enabled = String(process.env.CLEANUP_ENABLED ?? '').toLowerCase();
  const isEnabled = ['1', 'true', 'yes', 'on'].includes(enabled);

  if (!isEnabled) {
    console.log('[cleanup] scheduler disabled (CLEANUP_ENABLED=false)');
    return;
  }

  const runAt = String(process.env.CLEANUP_RUN_AT ?? '03:30');
  const [hh, mm] = runAt.split(':').map(n => Number(n));
  const H = Number.isFinite(hh) ? hh : 3;
  const M = Number.isFinite(mm) ? mm : 30;

  const msUntilNext = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(H, M, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  };

  const scheduleNext = () => {
    const delay = msUntilNext();
    console.log(`[cleanup] next run at ${runAt} (in ~${Math.round(delay/1000)}s)`);
    setTimeout(async () => {
      try {
        const res = await runCleanupOnce(db);
        console.log('[cleanup] run result:', res.message);
      } catch (e) {
        console.error('[cleanup] run failed:', e);
      } finally {
        scheduleNext();
      }
    }, delay);
  };

  scheduleNext();
}

