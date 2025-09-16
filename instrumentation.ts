import 'server-only';
// ЭТО ЗАПУСК ПЛАНИРОВЩИКА РЕГ ЗАДАНИЙ
// instrumentation.ts (корень репозитория)
import { bootstrapServerOnce } from '@/lib/server/bootstrap';
export const config = { runtime: 'nodejs' }; // ← обязали Node

// Next.js вызовет register() при старте Node-процесса
export async function register() {
  try {
    // Опционально: выключатель, чтобы не стартовать в build-окружении и т.п.
    if (!Boolean(process.env.JOBS_ENABLED) ) return;

    await bootstrapServerOnce(); // внутри вызовет startJobsInThisProcess(ds)
    console.log('[instrumentation] jobs bootstrapped');
  } catch (e) {
    console.error('[instrumentation] jobs bootstrap failed', e);
  }
}
