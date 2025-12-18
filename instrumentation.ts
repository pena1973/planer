// instrumentation.ts
import 'server-only';
export const runtime = 'nodejs';

// ЭТО ЗАПУСК ПЛАНИРОВЩИКА РЕГ ЗАДАНИЙ
// instrumentation.ts (корень репозитория)
// import { bootstrapServerOnce } from '@/lib/server/bootstrap';
export const config = { runtime: 'nodejs' }; // ← обязали Node

// Next.js вызовет register() при старте Node-процесса
export async function register() {
  
  try {
    // Опционально: выключатель, чтобы не стартовать в build-окружении и т.п.
    if (!Boolean(process.env.JOBS_ENABLED)) return;

    // подстраховка, если вдруг это edge
    // @ts-ignore
    if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') return;

    // ⬇️ КЛЮЧЕВОЕ: динамический импорт только здесь
    const { bootstrapServerOnce } = await import('./lib/server/bootstrap');

    await bootstrapServerOnce(); // внутри вызовет startJobsInThisProcess(ds)
    console.log('[instrumentation] jobs bootstrapped');
  } catch (e) {
    console.error('[instrumentation] jobs bootstrap failed', e);
  }
}
