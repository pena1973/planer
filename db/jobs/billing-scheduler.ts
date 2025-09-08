// import { DataSource } from "typeorm";
// import { runMonthlyBilling } from "./../jobs/billing-core.js"; // твой файл из прошлого шага

// type BillingSchedulerState = {
//   started: boolean;
//   timer: NodeJS.Timeout | null;
// };

// // Храним состояние глобально, чтобы не запускать второй раз
// const G = globalThis as any;
// G.__billingScheduler = (G.__billingScheduler ??
//   ({ started: false, timer: null } as BillingSchedulerState)
// ) as BillingSchedulerState;

// // Разовый запуск (удобно для ручного триггера/тестов)
// export async function runBillingOnce(db: DataSource, date: Date = new Date()) {
//   if (!db.isInitialized) await db.initialize();
//   return runMonthlyBilling(db, date);
// }

// // Планировщик: каждое 1-е число месяца в HH:MM (локальное время процесса)
// export function startBillingScheduler(db: DataSource) {
//   const state: BillingSchedulerState = G.__billingScheduler;
//   if (state.started) return; // уже запущен
//   state.started = true;

//   const enabled = String(process.env.BILLING_ENABLED ?? "").toLowerCase();
//   const isEnabled = ["1", "true", "yes", "on"].includes(enabled);

//   if (!isEnabled) {
//     console.log("[billing] scheduler disabled (BILLING_ENABLED=false)");
//     state.started = false;
//     return;
//   }

//   const runAt = String(process.env.BILLING_RUN_AT ?? "05:00"); // HH:MM
//   const [hh, mm] = runAt.split(":").map((n) => Number(n));
//   const H = Number.isFinite(hh) ? hh : 5;
//   const M = Number.isFinite(mm) ? mm : 0;

//   // Сколько ждать до ближайшего 1-го числа в H:M
//   const msUntilNext = () => {
//     const now = new Date();
//     const next = new Date(now);
//     // ближайшее первое число текущего/следующего месяца
//     next.setMonth(now.getMonth(), 1);
//     next.setHours(H, M, 0, 0);
//     if (next <= now) {
//       next.setMonth(next.getMonth() + 1, 1);
//       next.setHours(H, M, 0, 0);
//     }
//     return next.getTime() - now.getTime();
//   };

//   const scheduleNext = () => {
//     const delay = msUntilNext();
//     const sec = Math.max(0, Math.round(delay / 1000));
//     console.log(`[billing] next run at 1st, ${runAt} (in ~${sec}s)`);
//     state.timer = setTimeout(async () => {
//       try {
//         if (!db.isInitialized) await db.initialize();
//         const res = await runMonthlyBilling(db, new Date());
//         console.log("[billing] run result:", res?.billedTeams?.length ?? 0, "invoices");
//       } catch (e) {
//         console.error("[billing] run failed:", e);
//       } finally {
//         // Планируем следующий запуск (через месяц)
//         scheduleNext();
//       }
//     }, delay);
//   };

//   scheduleNext();

//   // (опционально) сразу запустить при старте — удобно в проде 1-го числа
//   const runOnStart = String(process.env.BILLING_RUN_ON_START ?? "").toLowerCase();
//   if (["1", "true", "yes", "on"].includes(runOnStart)) {
//     setTimeout(async () => {
//       try {
//         if (!db.isInitialized) await db.initialize();
//         const res = await runMonthlyBilling(db, new Date());
//         console.log("[billing] initial run:", res?.billedTeams?.length ?? 0);
//       } catch (e) {
//         console.error("[billing] initial run failed:", e);
//       }
//     }, 0);
//   }

//   console.log(`[billing] scheduler started (BILLING_RUN_AT=${runAt})`);
// }

// // Полная остановка планировщика (без перезапуска процесса)
// export function stopBillingScheduler() {
//   const state: BillingSchedulerState = G.__billingScheduler;
//   if (state?.timer) clearTimeout(state.timer);
//   G.__billingScheduler = { started: false, timer: null } as BillingSchedulerState;
//   console.log("[billing] scheduler stopped");
// }
