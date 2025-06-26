
import React, { useEffect, useState, useRef } from 'react';
import styles from "./reportUnitsKPI.module.scss";
import Filter from "./Filter/filter";
import { UnitKPIItem, UnitItem,UnitBelongEnum,UnitTypeEnum } from "@/types/types";
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";
import { useTranslation } from 'react-i18next';

import { convertMinutesToTime1 } from "@/lib/utils"

interface ReportUnitsKPIProps {
  setMessage: (message: string) => void,
  teamId: number,
  userId: number,
  units: UnitItem[],
  token: string
}

interface ExpandKey {
  unitId: number, month: number | undefined,

}
const monthNames = [
  "January",   // 0
  "February",  // 1
  "March",     // 2
  "April",     // 3
  "May",       // 4
  "June",      // 5
  "July",      // 6
  "August",    // 7
  "September", // 8
  "October",   // 9
  "November",  // 10
  "December"   // 11
];

const ReportUnitsKPI: React.FC<ReportUnitsKPIProps> = ({
  setMessage,
  teamId,
  userId,
  units,
  token
}) => {
  const { t, i18n } = useTranslation();



  const [expandKeyValue, setExpandKeyValue] = useState([] as ExpandKey[]); // ключ expand
  const [unitsKPIValue, setUnitsKPIValue] = useState([] as UnitKPIItem[]); // массив kpi по дням
  const [showLoader, setShowLoader] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getUnitKPI = async (
    useUnit?: boolean,
    useDate?: boolean,
    useMonth?: boolean,
    unitId?: number | null,
    dateFrom?: string,
    dateTo?: string,
    month?: string) => {
    setShowLoader(true);

    const monthIndex = monthNames.indexOf(String(month)); // Ищем индекс месяца в массиве

    let filter = "";
    // фильтр
    if (useUnit && unitId) filter = filter.concat(`&unitId=${unitId}`)

    if (useDate) {
      const dateFrom1 = (dateFrom?.length === 0) ? '0001-01-01' : dateFrom;
      filter = filter.concat(`&dateFrom=${dateFrom1}`)

      const dateTo1 = (dateTo?.length === 0) ? '3000-01-01' : dateTo;
      filter = filter.concat(`&dateTo=${dateTo1}`)
    }

    if (useMonth) filter = filter.concat(`&month=${monthIndex}`)

    try {
      const res = await fetch(`api/report-units-kpi-api?userId=${userId}&teamId=${teamId}&today=${today.toLocaleDateString('en-CA')}${filter}`,
        {
          method: 'get',
          headers: new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json'
          }),
        }
      );
      if (res.status !== 200) {
        const receivedData = await res.json();
        // setMessage(receivedData.message);
        //  console.log(t('service.serverUnavailable') + res.status);
        setMessage(t('service.serverUnavailable') + receivedData.message);
      } else {
        const receivedData = await res.json();
        // console.log("receivedData", receivedData)

        if (receivedData.success) {

          setUnitsKPIValue(receivedData.unitsKPI as UnitKPIItem[]); //  получаем карту с операциями
          setMessage(receivedData.message);
        }
      }

      // } catch (e: any) {
      //   setMessage(t('service.serverUnavailable') + e.message)
      // }
    } catch (e: unknown) {
      let message = t('service.serverUnavailable');
      if (e instanceof Error) {
        message += e.message;
      }
      setMessage(message);
    }

    setShowLoader(false);
  }

  useEffect(() => {
    getUnitKPI();
  }, []);


  //  получаем юниты из общего массива
  const uniqueUnits: UnitItem[] = [];
  unitsKPIValue.forEach(item => {
    // Предполагается, что у каждого юнита есть уникальное поле id
    if (!uniqueUnits.some(u => u.id === item.unit.id) && item.unit.belong===UnitBelongEnum.inner && item.unit.type ===UnitTypeEnum.process) {
      uniqueUnits.push(item.unit);
    }
  });

  //  получаем месяца в которых есть инфо по юниту из общего массива
  interface UnitMonthPair {
    unit: UnitItem;
    month: number; // номер месяца (0-11, где 0 — январь, 11 — декабрь)
  }
  const unitMonthPairs: UnitMonthPair[] = [];
  unitsKPIValue.forEach(item => {
    const unit = item.unit;
    // Получаем месяц из строки даты. new Date(item.date) корректно работает, если дата имеет формат "YYYY-MM-DD"
    const month = new Date(item.date).getMonth();
    // Проверяем, что для данного юнита и месяца пары ещё не было добавлено
    if (!unitMonthPairs.some(pair => pair.unit.id === unit.id && pair.month === month)) {
      unitMonthPairs.push({ unit, month });
    }
  });


  // дерево отчета
  const unitsReactNodes = uniqueUnits.map((unitKey, index) => {


    let unitProductionTime = 0
    let unitOccupiedTime = 0
    let unitPlanedTime = 0;
    let unitEffectiveTime = 0;
    let unitDefectTime = 0;

    // месяцы юнита
    const unitMonthReactNodes = unitMonthPairs
      .filter(key => key.unit.id === unitKey.id)
      .map((monthKey, index) => {

        let monthProductionTime = 0;
        let monthOccupiedTime = 0;
        let monthPlanedTime = 0;
        let monthEffectiveTime = 0;
        let monthDefectTime = 0;
        // даты юнита
        const dateReactNodes = unitsKPIValue
          .filter(dateKey =>
            dateKey.unit.id === monthKey.unit.id &&
            new Date(dateKey.date).getMonth() === monthKey.month)
          .map((dateKey) => {
            const dateLoadind = Math.round(dateKey.occupiedTime / dateKey.productionTime * 100)
            const datePlan = (dateLoadind === 0) ? 0 : Math.round(dateKey.planedTime / dateKey.occupiedTime * 100)
            const dateResult = (dateLoadind === 0) ? 0 : Math.round(dateKey.effectiveTime / dateKey.occupiedTime * 100)
            const dateDefect = (dateLoadind === 0) ? 0 : Math.round(dateKey.defectTime / dateKey.occupiedTime * 100)

            const dateProductionTime = dateKey.productionTime;
            const dateOccupiedTime = dateKey.occupiedTime;


            monthProductionTime = monthProductionTime + dateKey.productionTime;
            monthOccupiedTime = monthOccupiedTime + dateKey.occupiedTime;
            monthPlanedTime = monthPlanedTime + dateKey.planedTime;
            monthEffectiveTime = monthEffectiveTime + dateKey.effectiveTime;
            monthDefectTime = monthDefectTime + dateKey.defectTime;

            unitProductionTime = unitProductionTime + dateKey.productionTime;
            unitOccupiedTime = unitOccupiedTime + dateKey.occupiedTime;
            unitPlanedTime = unitPlanedTime + dateKey.planedTime;
            unitEffectiveTime = unitEffectiveTime + dateKey.effectiveTime;
            unitDefectTime = unitDefectTime + dateKey.defectTime;

            return (
              <tr key={`M-${dateKey.unit.id}-${index}`}>
                <td></td>
                <td></td>
                <td className={styles.date_title}> {dateKey.date}</td>
                <td> {(dateProductionTime > 0) ? convertMinutesToTime1(dateProductionTime) : ""} </td>
                <td> {(dateLoadind > 0) ? `${dateLoadind} %` : ""}</td>
                <td> {(dateOccupiedTime > 0) ? convertMinutesToTime1(dateOccupiedTime) : ""} </td>
                <td> {(dateResult > 0) ? `${dateResult} %` : ""}</td>
                <td> {(datePlan > 0) ? `${datePlan} %` : ""}</td>
                <td> {(dateDefect > 0) ? `${dateDefect} %` : ""}</td>
              </tr>
            )
          })

        const monthLoadind = Math.round(monthOccupiedTime / monthProductionTime * 100)
        const monthPlan = (monthLoadind === 0) ? 0 : Math.round(monthPlanedTime / monthOccupiedTime * 100)
        const monthResult = (monthLoadind === 0) ? 0 : Math.round(monthEffectiveTime / monthOccupiedTime * 100)
        const monthDefect = (monthLoadind === 0) ? 0 : Math.round(monthDefectTime / monthOccupiedTime * 100)

        return (<>
          <tr key={`U-${monthKey.unit.id}-${index}`}>
            <td><div className={styles.expand_row}
              onClick={() => {
                if (expandKeyValue.some(key => key.unitId === unitKey.id && key.month === monthKey.month)) {
                  // убираем из списка
                  setExpandKeyValue(expandKeyValue.filter((key) => !(key.unitId === unitKey.id && key.month === monthKey.month)));
                } else {
                  // добавляем в список
                  setExpandKeyValue([...expandKeyValue, { unitId: Number(unitKey.id), month: monthKey.month }]);
                }
              }
              }>{(expandKeyValue.some(key => key.unitId === monthKey.unit.id && key.month === monthKey.month)) ? "—" : "+"}</div></td>
            <td></td>
            <td className={styles.month_title}> {monthNames[monthKey.month] || ""}</td>
            <td> {(monthProductionTime > 0) ? convertMinutesToTime1(monthProductionTime) : ""} </td>
            <td> {(monthLoadind > 0) ? `${monthLoadind} %` : ""}</td>
            <td> {(monthOccupiedTime > 0) ? convertMinutesToTime1(monthOccupiedTime) : ""} </td>
            <td> {(monthPlan > 0) ? `${monthPlan} %` : ""}</td>
            <td> {(monthResult > 0) ? `${monthResult} %` : ""}</td>
            <td> {(monthDefect > 0) ? `${monthDefect} %` : ""}</td>
          </tr>
          {expandKeyValue.some(key => key.unitId === Number(unitKey.id) && key.month === monthKey.month) && dateReactNodes}
        </>
        )
      })

    const unitLoadind = Math.round(unitOccupiedTime / unitProductionTime * 100)
    const unitPlan = (unitLoadind === 0) ? 0 : Math.round(unitPlanedTime / unitOccupiedTime * 100)
    const unitResult = (unitLoadind === 0) ? 0 : Math.round(unitEffectiveTime / unitOccupiedTime * 100)
    const unitDefect = (unitLoadind === 0) ? 0 : Math.round(unitDefectTime / unitOccupiedTime * 100)
    return (<React.Fragment key={index}>

      <tr>
        <td>
          <div className={styles.expand_row}
            onClick={() => {
              if (expandKeyValue.some(key => key.unitId === unitKey.id && key.month === undefined)) {
                // убираем из списка
                setExpandKeyValue(expandKeyValue.filter((key) => !(key.unitId === unitKey.id && key.month === undefined)));
              } else {
                // добавляем в список
                setExpandKeyValue([...expandKeyValue, { unitId: Number(unitKey.id), month: undefined }]);
              }
            }
            }>{(expandKeyValue.some(key => key.unitId === unitKey.id && key.month === undefined)) ? "—" : "+"}</div></td>
        <td> {unitKey.title}</td>
        <td> </td>
        <td> {(unitProductionTime > 0) ? convertMinutesToTime1(unitProductionTime) : ""} </td>
        <td> {(unitLoadind > 0) ? `${unitLoadind} %` : ""}</td>
        <td> {(unitOccupiedTime > 0) ? convertMinutesToTime1(unitOccupiedTime) : ""} </td>
        <td> {(unitPlan > 0) ? `${unitPlan} %` : ""}</td>
        <td> {(unitResult > 0) ? `${unitResult} %` : ""}</td>
        <td> {(unitDefect > 0) ? `${unitDefect} %` : ""}</td>
      </tr >
      {expandKeyValue.some(key => key.unitId === Number(unitKey.id) && key.month === undefined) && unitMonthReactNodes}
    </React.Fragment>
    )
  })


  return (
    <div className={styles.container}>
      <Filter
        monthNames={monthNames}
        units={units}
        getUnitKPI={getUnitKPI}

      />
      {showLoader &&
        <div className={styles.loader_container}>
          <div className={styles.title}>{t('reportUnitsKPI.wait')}</div>
          <ButtonLoader width={100} height={100} />
        </div>
      }

      {!showLoader && <div className={styles.table_container}>
        {/* Шапка таблицы */}
        <table className={styles._table}>
          <thead>
            <tr>
              <th>
                <div className={styles.expand_row}
                  onClick={() => {
                    if (expandKeyValue.length !== 0) {
                      // Если уже есть элементы, очищаем список
                      setExpandKeyValue([]);
                    } else {
                      // Если список пуст, заполняем его уникальными ExpandKey для каждого юнита и месяца
                      const expandKeys: ExpandKey[] = [];
                      unitsKPIValue.forEach(kpi => {
                        const unitId = Number(kpi.unit.id);
                        const kpiMonth = new Date(kpi.date).getMonth();

                        // Если для этого юнита нет записи с month = undefined, добавляем её
                        if (!expandKeys.some(key => key.unitId === unitId && key.month === undefined)) {
                          expandKeys.push({ unitId, month: undefined });
                        }
                        // Если для этого юнита нет записи с текущим месяцем, добавляем её
                        if (!expandKeys.some(key => key.unitId === unitId && key.month === kpiMonth)) {
                          expandKeys.push({ unitId, month: kpiMonth });
                        }
                      });
                      setExpandKeyValue(expandKeys);
                    }
                  }
                  }>{(expandKeyValue.length !== 0) ? "—" : "+"}</div>
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
            {unitsReactNodes}
          </tbody>
        </table>
      </div >}
    </div >
  )
};

export default ReportUnitsKPI;
