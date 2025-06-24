import Layout from "@/components/Layout/layout";
import UnitTaskStackProcess from "@/components/monitor/UnitTaskStackProcess/unitTaskStackProcess";
import UnitTaskStackControl from "@/components/monitor/UnitTaskStackControl/unitTaskStackControl";
import UnitTaskStackOutsource from "@/components/monitor/UnitTaskStackOutsource/unitTaskStackOutsource";
import ReportTCardState from "@/components/monitor/ReportTCardState/reportTCardState";
import ReportUnitsKPI from "@/components/monitor/ReportUnitsKPI/reportUnitsKPI";

import { ForwardButton, BackwardButton } from "@/components/monitor/ArrowButton/arrowButton";
import { useTranslation } from 'react-i18next';

import { useEffect, useState } from "react";

import { UnitBelongEnum, UnitLoadItem, StatusEnum, UnitTypeEnum, TCardOperationItem } from '@/types/types'

import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { isWeekend, isHoliday, isAdditionalTime } from "@/lib/utils";
import { setUnitLoads, setMonitorPoint, setTCards } from '@/store/slices';

export default function Monitor() {

  const { t, i18n } = useTranslation();

  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках
  // const [resource, setResource] = useState(1); // 1 - загрузка юнитов, 2 - KPI, отчеты

  const [day, setDay] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    return date;
  });

 const token = useSelector((state: RootState) => {
    return state.authSlice.token;
  })

  const team = useSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useSelector((state: RootState) => {
    return state.authSlice.user;
  })
  const monitorPoint = useSelector((state: RootState) => {
    return state.viewSlice.monitorPoint;
  })
  const units = useSelector((state: RootState) => {
    return state.catalogSlice.units;
  })
  const unitLoads = useSelector((state: RootState) => {
    return state.planSlice.unitLoads;
  })
  const settings = useSelector((state: RootState) => {
    return state.catalogSlice.settings;
  })
  const schedule = useSelector((state: RootState) => {
    return state.catalogSlice.schedule;
  })
  const unitExceptions = useSelector((state: RootState) => {
    return state.planSlice.unitExceptions;
  })
  const tCards = useSelector((state: RootState) => {
    return state.dataSlice.tCards;
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Пока новая дата является выходным или праздником и нет дополнительного времени,
    // продолжаем увеличивать дату.
    const day_ = new Date(day);
    while ((isWeekend(day_, schedule) || isHoliday(day_, schedule)) && !isAdditionalTime(day_, schedule)) {

      day_.setDate(day_.getDate() + 1);
    }
    setDay(day_)
  }, []);

  //  меняем статус карты (если нужно) и операции и лоадов по событию
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
          && load.date === day.toLocaleDateString("en-CA")
          && load.status !== StatusEnum.prepared)
      });
      const unitExceptions_ = unitExceptions.filter((ex) => {
        return (ex.unitId === unit.id && ex.date === day.toLocaleDateString("en-CA"))
      });
      // юниты работники
      if (unit.type === UnitTypeEnum.process) {
        return <UnitTaskStackProcess
        key={unit.id}
          unit={unit}
          tCards={tCards}
          day={day.toLocaleDateString("en-CA")}
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

        return <UnitTaskStackControl
        key={unit.id}
          unit={unit}
          tCards={tCards}
          day={day.toLocaleDateString("en-CA")}
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
            <div className="monitor_container_catalog" onClick={() => dispatch(setMonitorPoint(5))}>{t('monitor.syncCodes')}</div>

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
                const newDate = new Date(day);
                newDate.setDate(newDate.getDate() - 1);
                // Пока новая дата является выходным или праздником и нет дополнительного времени,
                // продолжаем уменьшать дату.
                while ((isWeekend(newDate, schedule) || isHoliday(newDate, schedule)) && !isAdditionalTime(newDate, schedule)) {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setDay(newDate);
              }} />

              <span className="current_day">{day.toLocaleDateString("en-CA")}</span>

              <ForwardButton onClick={() => {
                const newDate = new Date(day);
                newDate.setDate(newDate.getDate() + 1);
                // Пока новая дата является выходным или праздником и нет дополнительного времени,
                // продолжаем увеличивать дату.
                while ((isWeekend(newDate, schedule) || isHoliday(newDate, schedule)) && !isAdditionalTime(newDate, schedule)) {
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
              />
          </div>}
          {monitorPoint === 5 && <div className="container_monitor">
            <div className="catalog_title"> {t('monitor.kpi1')} </div>

          </div>
          }
        </div>

      </div>
    </Layout >
  )
}