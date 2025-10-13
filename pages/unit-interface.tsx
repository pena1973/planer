import Layout from "@/components/Layout/layout";
import UnitTaskStackProcess from "@/components/monitor/UnitTaskStackProcess/unitTaskStackProcess";
import UnitTaskStackControl from "@/components/monitor/UnitTaskStackControl/unitTaskStackControl";

import { ForwardButton, BackwardButton } from "@/components/monitor/ArrowButton/arrowButton";
import { useTranslation } from 'react-i18next';

import { useEffect, useState } from "react";

import { UnitLoadItem, StatusEnum, UnitTypeEnum, TCardOperationItem } from '@/types/types'

import { useRouter } from 'next/navigation';

import { YYYYMMDD } from "@/lib/common/utils";
import { ulogger } from "./../lib/common/universal-logger";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';

import { isWeekend, isHoliday, isAdditionalTime } from "@/lib/client/utils.client";
import { setUnitLoads, setTCards } from '@/store/slices';

import { getCurrentDateInDate, addDaysInZone } from "@/lib/client/timezone.client";

export default function UnitInterfase() {

  const { t } = useTranslation();

  const { push } = useRouter();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState(''); // индикация сообщения об ошибках

  const token = useAppSelector((state: RootState) => {
    return state.authSlice.token;
  })

  const team = useAppSelector((state: RootState) => {
    return state.catalogSlice.team;
  })
  const user = useAppSelector((state: RootState) => {
    return state.authSlice.user;
  })
  const unit = useAppSelector((state: RootState) => {
    return state.authSlice.unit;
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

  const [day, setDay] = useState(() => {
    const date = getCurrentDateInDate(schedule.timeZone)
    return date;
  });

  if (!activeTeam) push('/support')

  useEffect(() => {
    // Пока новая дата является выходным или праздником и нет дополнительного времени,
    // продолжаем увеличивать дату.
    // const day_ = new Date(day);
    let day_ = addDaysInZone(day, 0, schedule.timeZone);
    while ((isWeekend(YYYYMMDD(day_), schedule) || isHoliday(YYYYMMDD(day_), schedule)) && !isAdditionalTime(YYYYMMDD(day_), schedule)) {
      day_ = addDaysInZone(day_, 1, schedule.timeZone);
    }
    setDay(day_)
  }, []);

  const useAdaptiveHeight = (maxHeight: number, percentOfScreen: number = 100) => {
    const [height, setHeight] = useState(0);

    useEffect(() => {
      const updateHeight = () => {
        const calculated = (window.innerHeight * percentOfScreen) / 100 - 280;
        setHeight(Math.min(calculated, maxHeight));
      };

      updateHeight(); // при первом рендере
      window.addEventListener('resize', updateHeight); // при изменении размера

      return () => window.removeEventListener('resize', updateHeight);
    }, [maxHeight, percentOfScreen]);

    return height;
  };

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
      && elem.status === load.status 
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

  const unitReactNode = () => {
    if (!unit?.id) return <div className="unit_interfase_not_assigned_title" >{t('monitor.notes1')}</div>
    // фильтрую по юниту 
    const unitLoads_ = unitLoads.filter((load) => {
      return (
        load.unit.id === unit?.id
        && load.date === day.toLocaleDateString("en-CA")
        && load.status !== StatusEnum.prepared)
    });

    const unitExceptions_ = unitExceptions.filter((ex) => {
      return (ex.unitId === unit?.id && ex.date === day.toLocaleDateString("en-CA"))
    });

    // юниты работники
    if (unit?.type === UnitTypeEnum.process) {
      return <UnitTaskStackProcess
        key={unit?.id}
        unit={unit}
        tCards={tCards}
        day={day.toLocaleDateString("en-CA")}
        unitLoads={unitLoads_}
        containerHeight={containerHeight}
        containerWidth={450}
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
    if (settings.isQualControl && unit?.type === UnitTypeEnum.control) {
      const performedLoads = unitLoads.filter((lo) => lo.status === StatusEnum.performed);
      return <UnitTaskStackControl
        key={unit?.id}
        unit={unit}
        tCards={tCards}
        day={day.toLocaleDateString("en-CA")}
        performedLoads={performedLoads}
        containerHeight={containerHeight}
        containerWidth={450}
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

  const containerHeight = useAdaptiveHeight(650)

  return (
    <Layout>
      <div className="container_global" >

        <div className="container_unit_interface">

          <div className="catalog_title"> {t('monitor.unit1Loading')}</div>
          <div className="monitor_container_navigation">
            <BackwardButton onClick={() => {
              const newDate = addDaysInZone(day, -1, schedule.timeZone);
              // Пока новая дата является выходным или праздником и нет дополнительного времени,
              // продолжаем уменьшать дату.
              while ((isWeekend(YYYYMMDD(newDate), schedule) || isHoliday(YYYYMMDD(newDate), schedule)) && !isAdditionalTime(YYYYMMDD(newDate), schedule)) {
                newDate.setDate(newDate.getDate() - 1);
              }
              setDay(newDate);
            }} />

            <span className="current_day">{day.toLocaleDateString("en-CA")}</span>

            <ForwardButton onClick={() => {
              const newDate = addDaysInZone(day, 1, schedule.timeZone);
              // Пока новая дата является выходным или праздником и нет дополнительного времени,
              // продолжаем увеличивать дату.
              while ((isWeekend(YYYYMMDD(newDate), schedule) || isHoliday(YYYYMMDD(newDate), schedule)) && !isAdditionalTime(YYYYMMDD(newDate), schedule)) {
                newDate.setDate(newDate.getDate() + 1);
              }
              setDay(newDate);
            }} />

          </div>
          <div className="unit_interface_container">{unitReactNode()}</div>
        </div>

      </div>
    </Layout >
  )
}