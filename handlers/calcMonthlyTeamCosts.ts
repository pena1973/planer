// services/calcMonthlyTeamCosts.ts
import { Repository } from "typeorm";
import { TeamTable } from "./../db/models/catalogs/teams";
import { ActiveTimeTable } from "./../db/models/billing/active_time";
import { MainTable } from "./../db/models/billing/main";
import { generateTeamNumber } from "@/lib/utils"; // <- твоя функция
import { getMain, getTeams, getActiveTime } from './../handlers/handlers-get';
import { TeamItem } from "@/types/types";


export type TeamMonthlyCost = {
  teamId: number,
  activeDays: number,   // активных дней в рассматриваемом месяце
  daysInMonth: number,  // дней в месяце (всегда полный месяц)
  priceteam: number,        // итоговая месячная ставка (со скидкой для подчинённых)
  discountteam:number,      // скидка
  amountteam: number;         // priceteam * activeDays / daysInMonth, 2 знака
};

function startOfMonthUTC(y: number, m01: number) { return new Date(Date.UTC(y, m01 - 1, 1)); }
function endOfMonthUTC(y: number, m01: number) { return new Date(Date.UTC(y, m01, 0)); } // последний день
function todayUTC() { const n = new Date(); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())); }
function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function diffDaysInclusive(a: Date, b: Date) { const ms = b.getTime() - a.getTime(); if (ms < 0) return 0; return Math.floor(ms / 86400000) + 1; }

export async function calcMonthlyTeamCosts(
  teams: TeamItem[] | null,
  teamsRepository: Repository<TeamTable>,
  activeTimeRepository: Repository<ActiveTimeTable>,
  mainRepository: Repository<MainTable>,
  year: number,
  month: number,

): Promise<TeamMonthlyCost[]> {

  // Заборем застройки
  const main = await getMain(mainRepository, `${year}-${month}-01`)
 
  if (!main) {
      console.log('Не удалось обработать запрос calcMonthlyTeamCosts ' );
      return [];
    }
  
  const price = main.price;
  const discount = main.discount;

  // определяем даты расчета
  const now = todayUTC();

  const mStart = startOfMonthUTC(year, month); //начало переданного месяца
  const mEnd = endOfMonthUTC(year, month); // конец переданного месяца
  const daysInMonth = diffDaysInclusive(mStart, mEnd);    // дней в месяце

  const isCurrentMonth = (now.getUTCFullYear() === year) && (now.getUTCMonth() + 1 === month);

  const limitEnd = isCurrentMonth ? now : mEnd;           // считаем дни до «сегодня», если месяц текущий

  // если нет фильтра то получим все команды
  const teams_ = teams ?? await getTeams(teamsRepository);

  const teamIds = teams_.map(t => t.id);

  // 2) События активности до конца месяца (чтобы корректно восстановить состояние)
  const resActiveTime = await getActiveTime(activeTimeRepository, limitEnd, teamIds)
  if (!resActiveTime.success || !resActiveTime.events) {
    console.log('Не удалось обработать запрос. ' + resActiveTime.message);
    return [];
  }
  const events = resActiveTime.events;

  // 3) Нормализация: по каждому дню оставить только ПОСЛЕДНЕЕ событие
  const eventsByTeam = new Map<number, { date: string; direction: string }[]>();
  for (const ev of events) {
    const arr = eventsByTeam.get(ev.team_id) ?? [];
    arr.push({ date: ev.date, direction: String(ev.direction).toLowerCase() });
    eventsByTeam.set(ev.team_id, arr);
  }

  for (const [tid, arr] of eventsByTeam) {
    const byDate = new Map<string, string>();
    for (const e of arr) byDate.set(e.date, e.direction);
    const norm = Array.from(byDate.entries())
      .map(([date, direction]) => ({ date, direction }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    eventsByTeam.set(tid, norm);
  }

  // 4) Определим подчинённость через сравнение «номеров команд»
  //    основная: main_team === generateTeamNumber(prefix, id)
  const isSub = new Map<number, boolean>();
  for (const t of teams_) {
    const myCode = generateTeamNumber(t.prefix, t.id);
    isSub.set(t.id, t.main_team !== myCode); // если код другой → подчинённая
  }

  // 5) Подсчёт активных дней и стоимости
  const result: TeamMonthlyCost[] = [];

  for (const t of teams_) {
    const evs = eventsByTeam.get(t.id) ?? [];

    // состояние на начало месяца: смотрим последнее событие ДО mStart
    let active = false;
    for (let i = evs.length - 1; i >= 0; i--) {
      if (evs[i].date < ymd(mStart)) {
        active = evs[i].direction === "start";
        break;
      }
    }

    let currentStart: Date | null = active ? mStart : null;
    let activeDays = 0;

    // события внутри рассматриваемого месяца
    for (const e of evs) {
      if (e.date < ymd(mStart)) continue;
      if (e.date > ymd(mEnd)) break;

      const d = new Date(e.date + "T00:00:00Z");
      const dir = e.direction;

      if (dir === "start") {
        if (!active) {
          active = true;
          currentStart = d < mStart ? mStart : d; // старт с этой даты (включительно)
        }
      } else if (dir === "finish") {
        if (active && currentStart) {
          // ВАЖНО: finish — ОПЛАЧИВАЕМЫЙ день → включаем сам d
          const segEnd = d > limitEnd ? limitEnd : d; // clamp по «сегодня» для текущего месяца
          const a = currentStart < mStart ? mStart : currentStart;
          const b = segEnd;
          activeDays += diffDaysInclusive(a, b);
          active = false;
          currentStart = null;
        }
      }
    }

    // если остались активными до конца рассматриваемого периода
    if (active && currentStart) {
      const a = currentStart < mStart ? mStart : currentStart;
      const b = limitEnd; // для текущего месяца — до «сегодня»
      activeDays += diffDaysInclusive(a, b);
    }

    // нормализация
    const maxPossible = diffDaysInclusive(mStart, limitEnd);
    if (!Number.isFinite(activeDays) || activeDays < 0) activeDays = 0;
    if (activeDays > maxPossible) activeDays = maxPossible;
   // цена для команды с учетом скидки
    const priceteam = isSub.get(t.id) ? +(price * (1 - discount / 100)).toFixed(2) : +price.toFixed(2); 
    // скидка для команды с учетом скидки
    const discountteam = isSub.get(t.id) ? +discount : 0; 
    const amountteam = +((priceteam * (activeDays / daysInMonth)).toFixed(2));

    // включаем в строки только активные дни
    if (activeDays>0)
    result.push({ teamId: t.id, activeDays, daysInMonth, discountteam, priceteam:price, amountteam });
  }

  result.sort((a, b) => a.teamId - b.teamId);
  return result;
}

