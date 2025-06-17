
import { useState } from "react";
import styles from "./filter.module.scss";
import { useTranslation } from 'react-i18next';
import { UnitBelongEnum, UnitItem, UnitTypeEnum } from "@/types/types";


interface FilterComponentProps {
    monthNames: string[];
    units: UnitItem[]; // Принимаем список юнитов
    getUnitKPI: (
        useUnit: boolean,
        useDate: boolean,
        useMonth: boolean,
        unitId: number | null,
        dateFrom: string,
        dateTo: string,
        month: string
    ) => void;
}

const FilterComponent: React.FC<FilterComponentProps> = ({
    monthNames,
    getUnitKPI,
    units
}) => {
    const { t } = useTranslation();
    const [useUnitFilter, setUseUnitFilter] = useState(false);
    const [useDateFilter, setUseDateFilter] = useState(false);
    const [useMonthFilter, setUseMonthFilter] = useState(false);

    const [unitFilter, setUnitFilter] = useState<number | null>(null); // Модифицировано для использования ID юнита
    const [dateFromFilter, setDateFromFilter] = useState("");
    const [dateToFilter, setDateToFilter] = useState("");
    const [monthFilter, setMonthFilter] = useState<string>(""); // Поддержка пустого значения
    const [isOpenUnit, setIsOpenUnit] = useState(false); // Для управления открытием/закрытием списка
    const [isOpenMonth, setIsOpenMonth] = useState(false); // Для управления открытием/закрытием списка

    // Открытие/закрытие выпадающего списка
    const toggleDropdownUnit = () => setIsOpenUnit(!isOpenUnit);
    const toggleDropdownMonth = () => setIsOpenMonth(!isOpenMonth);

    // Обработчик выбора месяца
    const handleSelectMonth = (value: string | null) => {
        setMonthFilter(value || ""); // Обновляем месяц или сбрасываем
        setIsOpenMonth(false); // Закрываем список после выбора
    };
 
    // Фильтруем юнитов которые только процесники
    const availableUnits = units.filter(unit => {
        return (unit.type === UnitTypeEnum.process && unit.belong === UnitBelongEnum.inner)
    });

    return (
        <div className={styles.filterContainer}>
            {/* Фильтрация по Юнитам */}
            <div className={styles.table_filter}>
                <input
                    id="useUnitFilter"
                    autoComplete="off"
                    checked={useUnitFilter}
                    type="checkbox"
                    onChange={() => setUseUnitFilter(prev => !prev)}
                />
                <div className={styles.table_filter_label}>{t('reportUnitsKPI.unit')}</div>
                <div className={styles.selectContainer}>
                    <div className={styles.select} onClick={toggleDropdownUnit}>
                        <div className={styles.selectedItem}>
                            {unitFilter ? (
                                availableUnits.find(unit => unit.id === unitFilter)?.title
                            ) : (
                                t('reportUnitsKPI.unitSelect')
                            )}
                        </div>
                        <div className={styles.arrow}>&#9662;</div>
                    </div>
                    {isOpenUnit && (
                        <ul className={styles.dropdownList}>
                            <li
                                key="none"
                                className={`${styles.dropdownItem} ${unitFilter === null ? styles.selected : ""}`}
                                onClick={() => {
                                    setUnitFilter(null); // Сброс выбранного юнита
                                    setIsOpenUnit(false); // Закрываем список после выбора
                                }}
                            >
                                -
                            </li>
                            {availableUnits.map(unit => (
                                <li
                                    key={unit.id}
                                    className={`${styles.dropdownItem} ${unit.id === unitFilter ? styles.selected : ""}`}
                                    onClick={() => {
                                        setUnitFilter((!unit.id) ? null : unit.id); // Устанавливаем ID выбранного юнита
                                        setIsOpenUnit(false); // Закрываем список после выбора
                                    }}
                                >
                                    {unit.title} {/* Показываем название юнита */}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Фильтрация по месяцу */}
            <div className={styles.table_filter}>
                <input
                    id="useMonthFilter"
                    autoComplete="off"
                    checked={useMonthFilter}
                    type="checkbox"
                    onChange={() => setUseMonthFilter(prev => !prev)}
                />
                <div className={styles.table_filter_label}>{t('reportUnitsKPI.month')}</div>

                <div className={styles.selectContainer}>
                    <div className={styles.select} onClick={toggleDropdownMonth}>
                        <div className={styles.selectedItem}>
                            {monthFilter ? monthNames.find(month => month === monthFilter) : t('reportUnitsKPI.monthSelect')}
                        </div>
                        <div className={styles.arrow}>&#9662;</div>
                    </div>

                    {isOpenMonth && (
                        <ul className={styles.dropdownList}>
                            <li
                                key=""
                                className={`${styles.dropdownItem} ${monthFilter === "" ? styles.selected : ""}`}
                                onClick={() => handleSelectMonth("")}
                            >
                                -
                            </li>
                            {monthNames.map(month => (
                                <li
                                    key={month}
                                    className={`${styles.dropdownItem} ${month === monthFilter ? styles.selected : ""}`}
                                    onClick={() => handleSelectMonth(month)}
                                >
                                    {month}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Фильтрация по дате */}
            <div className={styles.table_filter}>
                <input
                    id="useDateFilter"
                    autoComplete="off"
                    checked={useDateFilter}
                    type="checkbox"
                    onChange={() => setUseDateFilter(prev => !prev)}
                />
                <div className={styles.table_filter_label}>{t('reportUnitsKPI.dateFrom')}</div>
                <input
                    className={styles.filterInput}
                    id="tCardDateFrom"
                    autoComplete="off"
                    value={dateFromFilter}
                    type="date"
                    onChange={e => setDateFromFilter(e.target.value)}
                />
                <div className={styles.table_filter_label}>{t('reportUnitsKPI.dateTo')}</div>
                <input
                    className={styles.filter_input}
                    id="tCardDateTo"
                    autoComplete="off"
                    value={dateToFilter}
                    type="date"
                    onChange={e => setDateToFilter(e.target.value)}
                />
            </div>

            <button
                className={styles.button_filter}
                onClick={() => {

                    getUnitKPI(
                        useUnitFilter,
                        useDateFilter,
                        useMonthFilter,
                        unitFilter,
                        dateFromFilter,
                        dateToFilter,
                        monthFilter
                    )

                }}
            >

                {t('reportTCardState.apply')}
            </button>
        </div>
    );
};

export default FilterComponent;
