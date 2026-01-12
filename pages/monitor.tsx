import Layout from "@/components/Layout/layout";
import UnitTaskStackProcess from "@/components/monitor/UnitTaskStackProcess/unitTaskStackProcess";
import UnitTaskStackControl from "@/components/monitor/UnitTaskStackControl/unitTaskStackControl";
import UnitTaskStackOutsource from "@/components/monitor/UnitTaskStackOutsource/unitTaskStackOutsource";
import ReportTCardState from "@/components/monitor/ReportTCardState/reportTCardState";
import ReportUnitsKPI from "@/components/monitor/ReportUnitsKPI/reportUnitsKPI";

import { ForwardButton, BackwardButton } from "@/components/monitor/ArrowButton/arrowButton";
import { useTranslation } from 'react-i18next';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { UnitBelongEnum, UnitLoadItem, StatusEnum, UnitTypeEnum, TCardOperationItem } from '@/types/types'

import { YYYYMMDD } from "@/lib/common/utils";
import { ulogger } from "./../lib/common/universal-logger";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

// import { isWeekend, isHoliday, isAdditionalTime } from "@/lib/client/utils.client";
import { isWeekend, isHoliday, isAdditionalTime } from "@/lib/common/utils";
import { setUnitLoads, setMonitorPoint, setTCards } from '@/store/slices';
import { getCurrentDateInDate, addDaysInZone } from "@/lib/client/timezone.client"
export default function Monitor() {

  const { t, i18n } = useTranslation();
  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState('');

  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })

  if (!token) push('/')

  const team = useAppSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useAppSelector((state: RootState) => {
    return state.authSlice.user;
  })
  const monitorPoint = useAppSelector((state: RootState) => {
    return state.viewSlice.monitorPoint;
  })
  const units = useAppSelector((state: RootState) => {
    return state.catalogSlice.units;
  })
  const unitLoads = useAppSelector((state: RootState) => {
    return state.planSlice.unitLoads;
  })
  const settings = useAppSelector((state: RootState) => {
    return state.catalogSlice.settings;
  })
  const schedule = useAppSelector((state: RootState) => {
    return state.catalogSlice.schedule;
  })
  const unitExceptions = useAppSelector((state: RootState) => {
    return state.planSlice.unitExceptions;
  })
  const tCards = useAppSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })
  //показывает текущее состояние активности команды
  const activeTeam = useAppSelector((state: RootState) => {
    return state.viewSlice.activeTeam;
  })
  const userUnits = useAppSelector((state: RootState) => {
    return state.catalogSlice.userUnits;
  })

  if (!activeTeam) push('/support')

  const [day, setDay] = useState(() => {
    const date = getCurrentDateInDate(schedule.timeZone)
    return date;
  });

  useEffect(() => {
    let today = getCurrentDateInDate(schedule.timeZone);
    // если  день приходится на выходные  и в настройках указано что мы скрываем выходные но нет доп часов на это время
    // крутим до первого буднего дня
    while (!settings.showWeekend && isWeekend(YYYYMMDD(today), schedule) && !isAdditionalTime(YYYYMMDD(today), schedule)) {
      today = addDaysInZone(today, 1, schedule.timeZone);
    }
    // если  день приходится на праздники  и в настройках указано что мы скрываем праздники
    // крутим до первого буднего дня
    while (!settings.showHoliday && isHoliday(YYYYMMDD(today), schedule) && !isAdditionalTime(YYYYMMDD(today), schedule)) {
      today = addDaysInZone(today, 1, schedule.timeZone);
    }
    setDay(today);

  }, []);

  //  меняем статус карты (если нужно) и операции и лоадов по событию
  // На клиенте
  const setStatusLoadsHandler = (tCardStatus: StatusEnum, tOperStatus: StatusEnum, operloadsIds: number[], operId: number, tCardId: number) => {

    const cardIndex = tCards.findIndex(card => card.id === tCardId);
    if (cardIndex < 0) return

    // обновили лоады
    const unitLoads_ = unitLoads.map(lo => operloadsIds.includes(lo.id as number) ? { ...lo, status: tOperStatus } : lo);
    dispatch(setUnitLoads(unitLoads_));

    // Обновляем статус операции если он загружен
    const tCardOperations = tCards[cardIndex].tCardOperations?.map(operation => {
      if (operation.id === operId) {
        return { ...operation, status: tOperStatus };
      }
      return operation;
    }) as TCardOperationItem[];


    const updatedTCard = { ...tCards[cardIndex], status: tCardStatus, tCardOperations: tCardOperations }

    const _tCards = [...tCards]
    _tCards.splice(cardIndex, 1, updatedTCard);

    dispatch(setTCards(_tCards));
  }

  //  временные границы операции по лоаду
  // На клиенте
  const getStartFinishOper = (load: UnitLoadItem)
    : { start: { date: string, time: number }, finish: { date: string, time: number } } => {

    if (!load.id) return { start: { date: "", time: 0 }, finish: { date: "", time: 0 } };

    const loads = unitLoads.filter((elem) =>
      elem.id_oper === load.id_oper
      && elem.status === load.status //  потом можно будет убрать  связь будет по version
      && !elem.isRetool
      && elem.version === load.version

    ) // все лоады операции

    if (loads.length === 0) return { start: { date: "", time: 0 }, finish: { date: "", time: 0 } };

    let earliestLoad = loads[0];
    let latestLoad = loads[0];

    for (const load of loads) {
      // Для earliest: если дата меньше или, при равных датах, время старта меньше
      if (load.date < earliestLoad.date || (load.date === earliestLoad.date && load.timeStart < earliestLoad.timeStart)) {
        earliestLoad = load;
      }
      // Для latest: если дата больше или, при равных датах, время завершения больше
      if (load.date > latestLoad.date || (load.date === latestLoad.date && load.timeFinish > latestLoad.timeFinish)) {
        latestLoad = load;
      }
    }
    return {
      start: { date: earliestLoad.date, time: earliestLoad.timeStart },
      finish: { date: latestLoad.date, time: latestLoad.timeFinish }
    };
  }

  const unitsValueReactNodes = units
    .filter((elem) => elem.belong === UnitBelongEnum.inner)
    .map((unit) => {
      // фильтрую по юниту 
      const unitLoads_ = unitLoads.filter((load) => {
        return (
          load.unit.id === unit.id
          && load.date === YYYYMMDD(day)
          && load.status !== StatusEnum.prepared)
      });
      const unitExceptions_ = unitExceptions.filter((ex) => {
        return (ex.unitId === unit.id && ex.date === YYYYMMDD(day))
      });
      // юниты работники
      if (unit.type === UnitTypeEnum.process) {
        const userUnit = userUnits.find(u => u.unit?.id === unit.id);
        const nickname = userUnit?.name || t("scale.notAssigned");

        return <UnitTaskStackProcess
          key={unit.id}
          unit={unit}
          nickname={nickname}
          tCards={tCards}
          day={YYYYMMDD(day)}
          unitLoads={unitLoads_}
          containerHeight={400}
          settings={settings}
          schedule={schedule}
          unitExceptions={unitExceptions_}
          setMessage={setMessage}
          getStartFinishOper={getStartFinishOper}
          setStatusLoadsHandler={setStatusLoadsHandler}
          teamId={team.id}
          userId={user.id}
          token={token}
        />
      }

      // юниты контролеры используется только если включен контроль качества в настройках
      if (settings.isQualControl && unit.type === UnitTypeEnum.control) {
        const performedLoads = unitLoads.filter((lo) => lo.status === StatusEnum.performed);
        const userUnit = userUnits.find(u => u.unit?.id === unit.id);
        const nickname = userUnit?.name || t("scale.notAssigned");

        return <UnitTaskStackControl
          key={unit.id}
          unit={unit}
          nickname={nickname}
          tCards={tCards}
          day={YYYYMMDD(day)}
          performedLoads={performedLoads}
          containerHeight={400}
          setMessage={setMessage}
          getStartFinishOper={getStartFinishOper}
          setStatusLoadsHandler={setStatusLoadsHandler}
          isQualControl={settings.isQualControl}
          teamId={team.id}
          userId={user.id}
          token={token}
        />

      }
    }
    )

  const outerLoads = unitLoads.filter((lo) => lo.unit.belong === UnitBelongEnum.outer && lo.status === StatusEnum.planed);

  return (
    <Layout>
      <div className="container_global" >
        <div className="container_global_left">
          <div className="container_catalogs">
            <div className="monitor_container_catalog" onClick={() => dispatch(setMonitorPoint(1))}>{t('monitor.unitLoading')}</div>
            <div className="monitor_container_catalog" onClick={() => dispatch(setMonitorPoint(2))}>{t('monitor.outerActions')}</div>
            <div className="monitor_container_catalog" onClick={() => dispatch(setMonitorPoint(3))}>{t('monitor.readiness')}</div>
            <div className="monitor_container_catalog" onClick={() => dispatch(setMonitorPoint(4))}>{t('monitor.kpi')}</div>

          </div>
          <div className="container_cards_title">{t('monitor.notes')}</div>
          <div className="container_global_message">{message}</div>

        </div>

        <div className="container_global_right">

          {/* Настройки */}
          {monitorPoint === 1 && <div className="container_monitor">

            <div className="catalog_title"> {t('monitor.unitLoading')}</div>
            <div className="monitor_container_navigation">
              <BackwardButton onClick={() => {
                const newDate = addDaysInZone(day, -1, schedule.timeZone);
                // Пока новая дата является выходным или праздником и нет дополнительного времени,
                // продолжаем уменьшать дату.
                while ((isWeekend(newDate.toLocaleDateString('en-CA'), schedule) || isHoliday(newDate.toLocaleDateString('en-CA'), schedule)) && !isAdditionalTime(newDate.toLocaleDateString('en-CA'), schedule)) {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setDay(newDate);
              }} />

              <span className="current_day">{day.toLocaleDateString("en-CA")}</span>

              <ForwardButton onClick={() => {
                const newDate = addDaysInZone(day, 1, schedule.timeZone);
                // Пока новая дата является выходным или праздником и нет дополнительного времени,
                // продолжаем увеличивать дату.
                while ((isWeekend(newDate.toLocaleDateString('en-CA'), schedule) || isHoliday(newDate.toLocaleDateString('en-CA'), schedule)) && !isAdditionalTime(newDate.toLocaleDateString('en-CA'), schedule)) {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setDay(newDate);
              }} />

            </div>
            <div className="monitor_container">{unitsValueReactNodes}</div>
          </div>}
          {/* состояние операций на outsource */}
          {monitorPoint === 2 && <div className="container_monitor">
            <div className="catalog_title">{t('monitor.outerActions1')}</div>
            <UnitTaskStackOutsource
              outerLoads={outerLoads}
              tCards={tCards}
              setMessage={setMessage}
              getStartFinishOper={getStartFinishOper}
              setStatusLoadsHandler={setStatusLoadsHandler}
              teamId={team.id}
              userId={user.id}
              token={token}
            />
          </div>}
          {/* Готовность карт */}
          {monitorPoint === 3 && <div className="container_monitor">
            <div className="catalog_title">{t('monitor.readiness')}</div>
            <ReportTCardState setMessage={setMessage}
              teamId={team.id}
              userId={user.id}
              token={token}
            />
          </div>}
          {monitorPoint === 4 && <div className="container_monitor">
            <div className="catalog_title">{t('monitor.kpi1')}</div>
            <ReportUnitsKPI
              setMessage={setMessage}
              teamId={team.id}
              userId={user.id}
              units={units}
              token={token}
              timezone={schedule.timeZone}
            />
          </div>}
        </div>

      </div>
    </Layout >
  )
}