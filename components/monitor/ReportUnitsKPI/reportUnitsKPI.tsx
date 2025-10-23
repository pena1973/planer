
import React, { useEffect, useMemo, useState, useCallback, useTransition } from 'react';
import styles from "./reportUnitsKPI.module.scss";
import { getUnitsKPI } from '@/services/monitor/getUnitsKPI';
import Filter from "./Filter/filter";
import { UnitKPIItem, UnitItem } from "@/types/types";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { useTranslation } from 'react-i18next';
import { convertMinutesToTime1 } from "@/lib/client/utils.client"
import { getCurrentDateInDate, getTimeZoneDateFromDateString } from "@/lib/client/timezone.client"
import { UnitBelongEnum, UnitTypeEnum } from '@/types/types';

interface ReportUnitsKPIProps {
  setMessage: (message: string) => void,
  teamId: number,
  userId: number,
  units: UnitItem[],
  token: string,
  timezone: string,
}


const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// безопасное деление в проценты
const pct = (num: number, den: number) =>
  den > 0 ? Math.round((num / den) * 100) : 0;

// 1) ДОБАВЬ type guard (выше компонента)
const hasNumericId = (u: UnitItem): u is UnitItem & { id: number } =>
  typeof (u as any).id === 'number' && Number.isFinite((u as any).id);
type MonthIdx = number; // 0..11

type DateRow = {
  dateStr: string;
  productionTime: number;
  occupiedTime: number;
  planedTime: number;
  effectiveTime: number;
  defectTime: number;
};

type MonthBucket = {
  month: MonthIdx;
  dates: DateRow[];
  totals: {
    productionTime: number;
    occupiedTime: number;
    planedTime: number;
    effectiveTime: number;
    defectTime: number;
  };
};

type UnitBucket = {
  unit: UnitItem;
  unitId: number; // ← добавили
  months: Map<MonthIdx, MonthBucket>;
  totals: {
    productionTime: number;
    occupiedTime: number;
    planedTime: number;
    effectiveTime: number;
    defectTime: number;
  };
};


const ReportUnitsKPI: React.FC<ReportUnitsKPIProps> = ({
  setMessage,
  teamId,
  userId,
  units,
  token,
  timezone
}) => {
  const { t, i18n } = useTranslation();
  const [unitsKPIValue, setUnitsKPIValue] = useState<UnitKPIItem[]>([]);
  const [showLoader, setShowLoader] = useState(false);

  // Разделяю раскрытия на 2 набора для мгновенных проверок O(1)
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const today = getCurrentDateInDate(timezone);

  const getUnitKPIHandler = useCallback(async (
    useUnit?: boolean,
    useDate?: boolean,
    useMonth?: boolean,
    unitId?: number | null,
    dateFrom?: string,
    dateTo?: string,
    month?: string
  ) => {
    setShowLoader(true);

    const monthIndex = monthNames.indexOf(String(month));
    let filter = "";

    if (useUnit && unitId) filter += `&unitId=${unitId}`;

    if (useDate) {
      const dateFrom1 = (dateFrom?.length === 0) ? '0001-01-01' : dateFrom;
      const dateTo1 = (dateTo?.length === 0) ? '3000-01-01' : dateTo;
      filter += `&dateFrom=${dateFrom1}&dateTo=${dateTo1}`;
    }

    if (useMonth && monthIndex >= 0) filter += `&month=${monthIndex + 1}`;

    await getUnitsKPI(
      userId,
      teamId,
      token,
      today,
      t,
      i18n.language,
      setMessage,
      setUnitsKPIValue,
      filter
    );

    setShowLoader(false);
    // При новой загрузке можно свернуть всё, чтобы рендер был дешевле
    startTransition(() => {
      setExpandedUnits(new Set());
      setExpandedMonths(new Set());
    });
  }, [i18n.language, t, setMessage, teamId, token, today, userId]);

  useEffect(() => {
    // initial load
    getUnitKPIHandler();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Один проход: группируем данные → юнит → месяц → даты + тоталы
  const grouped = useMemo(() => {
    const unitsMap = new Map<number, UnitBucket>();

    for (const item of unitsKPIValue) {
      const u = item.unit;
      // фильтруем тут, чтобы дальше не плодить лишнее
      if (u.belong !== UnitBelongEnum.inner || u.type !== UnitTypeEnum.process) continue;
      if (!hasNumericId(u)) continue;                 // ← важно

      // месяц считаем один раз с учётом TZ
      const d = getTimeZoneDateFromDateString(item.date, timezone);
      const m = d.getMonth() as MonthIdx;

      let ub = unitsMap.get(u.id);
      if (!ub) {
        ub = {
          unit: u,
          unitId: u.id,                                // ← сохраняем числовой id
          months: new Map<MonthIdx, MonthBucket>(),
          totals: {
            productionTime: 0,
            occupiedTime: 0,
            planedTime: 0,
            effectiveTime: 0,
            defectTime: 0,
          }
        };
        unitsMap.set(u.id, ub);
      }

      let mb = ub.months.get(m);
      if (!mb) {
        mb = {
          month: m,
          dates: [],
          totals: {
            productionTime: 0,
            occupiedTime: 0,
            planedTime: 0,
            effectiveTime: 0,
            defectTime: 0,
          }
        };
        ub.months.set(m, mb);
      }

      // пушим одну строку даты (не пересчитывая потом)
      const row: DateRow = {
        dateStr: item.date,
        productionTime: item.productionTime,
        occupiedTime: item.occupiedTime,
        planedTime: item.planedTime,
        effectiveTime: item.effectiveTime,
        defectTime: item.defectTime
      };
      mb.dates.push(row);

      // копим тоталы месяца
      mb.totals.productionTime += item.productionTime;
      mb.totals.occupiedTime += item.occupiedTime;
      mb.totals.planedTime += item.planedTime;
      mb.totals.effectiveTime += item.effectiveTime;
      mb.totals.defectTime += item.defectTime;

      // и тоталы юнита
      ub.totals.productionTime += item.productionTime;
      ub.totals.occupiedTime += item.occupiedTime;
      ub.totals.planedTime += item.planedTime;
      ub.totals.effectiveTime += item.effectiveTime;
      ub.totals.defectTime += item.defectTime;
    }

    // Для стабильности порядка — отрендерим в порядке title юнита, а месяцы — по возрастанию
    const orderedUnits = Array.from(unitsMap.values()).sort((a, b) =>
      (a.unit.title || "").localeCompare(b.unit.title || "", undefined, { numeric: true })
    );

    for (const ub of orderedUnits) {
      // сортировка дат внутри месяцев по строке даты (YYYY-MM-DD -> лексикографически ок)
      for (const mb of ub.months.values()) {
        mb.dates.sort((a, b) => (a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0));
      }
    }

    return orderedUnits;
  }, [unitsKPIValue, timezone]);

  // Ключ месяца в Set
  const monthKey = useCallback((unitId: number, m: number) => `${unitId}-${m}`, []);

  // Триггеры раскрытий (обёрнуты в startTransition, чтобы UI не подвисал)
  const toggleUnit = useCallback((unitId: number) => {
    startTransition(() => {
      setExpandedUnits(prev => {
        const next = new Set(prev);
        if (next.has(unitId)) next.delete(unitId);
        else next.add(unitId);
        return next;
      });
    });
  }, []);

  const toggleMonth = useCallback((unitId: number, m: number) => {
    startTransition(() => {
      const key = monthKey(unitId, m);
      setExpandedMonths(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    });
  }, [monthKey]);

  const toggleAll = useCallback(() => {
    startTransition(() => {
      if (expandedUnits.size || expandedMonths.size) {
        setExpandedUnits(new Set());
        setExpandedMonths(new Set());
      } else {
        // раскрыть всё: все юниты и все их месяцы
        const uSet = new Set<number>();
        const mSet = new Set<string>();
        for (const ub of grouped) {
          uSet.add(ub.unitId);
          for (const m of ub.months.keys()) mSet.add(monthKey(ub.unitId, m));
        }
        setExpandedUnits(uSet);
        setExpandedMonths(mSet);
      }
    });
  }, [expandedUnits.size, expandedMonths.size, grouped, monthKey]);

  return (
    <div className={styles.container}>
      <Filter
        monthNames={monthNames}
        units={units}
        getUnitKPIHandler={getUnitKPIHandler}
      />

      {showLoader &&
        <div className={styles.loader_container}>
          <div className={styles.title}>{t('reportUnitsKPI.wait')}</div>
          <ButtonLoader width={100} height={100} />
        </div>
      }

      {!showLoader && (
        <div className={styles.table_container}>
          <table className={styles._table}>
            <thead>
              <tr>
                <th>
                  <div className={styles.expand_row} onClick={toggleAll}>
                    {(expandedUnits.size || expandedMonths.size) ? "—" : "+"}
                  </div>
                </th>
                <th className={styles.unit_top}>{t('reportUnitsKPI.unit')}</th>
                <th className={styles.unit_top}>{t('reportUnitsKPI.date')}</th>
                <th>{t('reportUnitsKPI.workTime')}</th>
                <th>{t('reportUnitsKPI.loading')}</th>
                <th>{t('reportUnitsKPI.busyTime')}</th>
                <th>{t('reportUnitsKPI.plan')}</th>
                <th>{t('reportUnitsKPI.result')}</th>
                <th>{t('reportUnitsKPI.defect')}</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((ub) => {
                const uId = ub.unitId;
                const uExp = expandedUnits.has(uId);

                const uLoad = pct(ub.totals.occupiedTime, ub.totals.productionTime);
                const uPlan = uLoad ? pct(ub.totals.planedTime, ub.totals.occupiedTime) : 0;
                const uRes = uLoad ? pct(ub.totals.effectiveTime, ub.totals.occupiedTime) : 0;
                const uDef = uLoad ? pct(ub.totals.defectTime, ub.totals.occupiedTime) : 0;

                return (
                  <React.Fragment key={`unit-${uId}`}>
                    <tr>
                      <td>
                        <div className={styles.expand_row} onClick={() => toggleUnit(uId)}>
                          {uExp ? "—" : "+"}
                        </div>
                      </td>
                      <td>{ub.unit.title}</td>
                      <td></td>
                      <td>{ub.totals.productionTime > 0 ? convertMinutesToTime1(ub.totals.productionTime) : ""}</td>
                      <td>{uLoad > 0 ? `${uLoad} %` : ""}</td>
                      <td>{ub.totals.occupiedTime > 0 ? convertMinutesToTime1(ub.totals.occupiedTime) : ""}</td>
                      <td>{uPlan > 0 ? `${uPlan} %` : ""}</td>
                      <td>{uRes > 0 ? `${uRes} %` : ""}</td>
                      <td>{uDef > 0 ? `${uDef} %` : ""}</td>
                    </tr>

                    {uExp && Array
                      .from(ub.months.values())
                      .sort((a, b) => a.month - b.month)
                      .map((mb) => {
                        const mk = monthKey(uId, mb.month);
                        const mExp = expandedMonths.has(mk);

                        const mLoad = pct(mb.totals.occupiedTime, mb.totals.productionTime);
                        const mPlan = mLoad ? pct(mb.totals.planedTime, mb.totals.occupiedTime) : 0;
                        const mRes = mLoad ? pct(mb.totals.effectiveTime, mb.totals.occupiedTime) : 0;
                        const mDef = mLoad ? pct(mb.totals.defectTime, mb.totals.occupiedTime) : 0;

                        return (
                          <React.Fragment key={`unit-${uId}-m-${mb.month}`}>
                            <tr>
                              <td>
                                <div className={styles.expand_row} onClick={() => toggleMonth(uId, mb.month)}>
                                  {mExp ? "—" : "+"}
                                </div>
                              </td>
                              <td></td>
                              <td className={styles.month_title}>{monthNames[mb.month] || ""}</td>
                              <td>{mb.totals.productionTime > 0 ? convertMinutesToTime1(mb.totals.productionTime) : ""}</td>
                              <td>{mLoad > 0 ? `${mLoad} %` : ""}</td>
                              <td>{mb.totals.occupiedTime > 0 ? convertMinutesToTime1(mb.totals.occupiedTime) : ""}</td>
                              <td>{mPlan > 0 ? `${mPlan} %` : ""}</td>
                              <td>{mRes > 0 ? `${mRes} %` : ""}</td>
                              <td>{mDef > 0 ? `${mDef} %` : ""}</td>
                            </tr>

                            {mExp && mb.dates.map((dr) => {
                              const dLoad = pct(dr.occupiedTime, dr.productionTime);
                              const dPlan = dLoad ? pct(dr.planedTime, dr.occupiedTime) : 0;
                              const dRes = dLoad ? pct(dr.effectiveTime, dr.occupiedTime) : 0;
                              const dDef = dLoad ? pct(dr.defectTime, dr.occupiedTime) : 0;

                              return (
                                <tr key={`unit-${uId}-m-${mb.month}-d-${dr.dateStr}`}>
                                  <td></td>
                                  <td></td>
                                  <td className={styles.date_title}>{dr.dateStr}</td>
                                  <td>{dr.productionTime > 0 ? convertMinutesToTime1(dr.productionTime) : ""}</td>
                                  <td>{dLoad > 0 ? `${dLoad} %` : ""}</td>
                                  <td>{dr.occupiedTime > 0 ? convertMinutesToTime1(dr.occupiedTime) : ""}</td>
                                  <td>{dPlan > 0 ? `${dPlan} %` : ""}</td>
                                  <td>{dRes > 0 ? `${dRes} %` : ""}</td>
                                  <td>{dDef > 0 ? `${dDef} %` : ""}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Можно показать мягкий индикатор во время больших разворачивания/сворачивания */}
      {isPending && <div className={styles.pending_hint}>{t('reportUnitsKPI.wait')}</div>}
    </div>
  );
};

export default ReportUnitsKPI;
